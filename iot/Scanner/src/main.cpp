/**
 * @file    main.cpp
 * @brief   Application entry point — ESP32 GM67 Barcode Scanner (WiFi + HTTP).
 *
 * ============================================================================
 * FULL SYSTEM INTEGRATION DATA FLOW
 * ============================================================================
 *
 *   GM67 Hardware
 *     → UART2 FIFO
 *     → GM67Scanner::update()        [non-blocking, every 10 ms]
 *     → BarcodeProcessor::process()  [sanitise → validate → debounce]
 *     → onBarcodeReady()             [callback defined below]
 *         ├─ Serial.println("BARCODE:<code>")   [USB debug output]
 *         └─ HttpClient::postScan()             [WiFi → FastAPI backend]
 *                 └─ POST /api/v1/iot/scan
 *                         └─ Backend looks up product in DB
 *                         └─ Backend broadcasts via WebSocket → POS.jsx
 *                         └─ Cashier sees product auto-added to cart ✓
 *
 * ============================================================================
 * OBJECT WIRING ORDER (dependency graph)
 * ============================================================================
 *
 *   DeviceStatus ◄── GM67Scanner
 *                ◄── (WifiManager status checked inline)
 *
 *   BarcodeProcessor ← callback λ → HttpClient → WifiManager (WiFi.status)
 *
 *   GM67Scanner ← BarcodeProcessor + DeviceStatus
 *
 * ============================================================================
 */

#include <Arduino.h>
#include "Config.h"
#include "Logger.h"
#include "DeviceStatus.h"
#include "BarcodeProcessor.h"
#include "GM67Scanner.h"
#include "WifiManager.h"
#include "ErsisHttpClient.h"

// =============================================================================
// Module instances (global static — no heap, no stack overflow risk)
// =============================================================================

DeviceStatus deviceStatus;
WifiManager  wifiManager;
ErsisHttpClient   httpClient;

// BarcodeProcessor with the application-layer callback.
// This is the SINGLE integration seam between scanner hardware and the network.
BarcodeProcessor barcodeProcessor([](const String& barcode) {

    // ------------------------------------------------------------------
    // 1. Always output to USB Serial (structured format for host tools).
    // ------------------------------------------------------------------
    Serial.print("BARCODE:");
    Serial.println(barcode);
    LOG_INFO("APP", ">>> BARCODE: %s", barcode.c_str());

    // ------------------------------------------------------------------
    // 2. POST to ERSIS backend over WiFi.
    //    HttpClient guards against WiFi being down — this never blocks
    //    longer than HTTP_TIMEOUT_MS (5 s).
    // ------------------------------------------------------------------
#ifdef FEATURE_WIFI_ENABLED
    ScanResponse resp = httpClient.postScan(barcode);

    switch (resp.result) {
        case HttpResult::OK:
            // Product found — the backend has already broadcast it to the
            // POS WebSocket. Log confirmation for the serial monitor.
            LOG_INFO("APP", "Product: %s  Price: %.2f  Stock: %d",
                     resp.productName.c_str(), resp.unitPrice, resp.stockQty);
            // Optionally: drive an LED/buzzer for cashier feedback here.
            break;

        case HttpResult::NOT_FOUND:
            LOG_WARN("APP", "Barcode '%s' not in store catalogue",
                     barcode.c_str());
            break;

        case HttpResult::WIFI_DOWN:
            LOG_WARN("APP", "WiFi down — scan queued for retry (not yet implemented)");
            // Phase 2: push to a local ring-buffer and retry when WiFi comes back.
            break;

        default:
            LOG_ERROR("APP", "HTTP error: %s  code=%d",
                      ErsisHttpClient::resultString(resp.result), resp.httpCode);
            break;
    }
#endif  // FEATURE_WIFI_ENABLED
});

GM67Scanner scanner(barcodeProcessor, deviceStatus);

// =============================================================================
// Heartbeat timer
// =============================================================================

static const uint32_t STATUS_INTERVAL_MS = 30000UL;
static uint32_t       lastStatusAt       = 0;

// =============================================================================
// setup()
// =============================================================================

void setup() {
    Logger::begin(SERIAL_DEBUG_BAUD);
    Logger::banner();

    LOG_INFO("MAIN", "Boot sequence starting...");

    // ---- 1. Connect WiFi (before scanner — gives WiFi stack time to settle) ----
#ifdef FEATURE_WIFI_ENABLED
    bool wifiOk = wifiManager.begin();
    if (wifiOk) {
        LOG_INFO("MAIN", "WiFi ready. IP: %s", wifiManager.getIP().c_str());
    } else {
        LOG_WARN("MAIN", "WiFi failed — running in offline mode (USB Serial only)");
        // Do NOT halt: scanner still works offline.
    }
#endif

    // ---- 2. Initialise the GM67 UART scanner ----
    if (!scanner.begin()) {
        LOG_ERROR("MAIN", "Scanner init FAILED — entering FAULT state");
        deviceStatus.setFault();
        return;
    }

    deviceStatus.setReady();
    LOG_INFO("MAIN", "Setup complete — scanning active");
}

// =============================================================================
// loop()
// =============================================================================

void loop() {
    // ---- FAULT guard ----
    if (deviceStatus.getState() == DeviceState::FAULT) {
        delay(1000);
        return;
    }

    // ---- WiFi watchdog ----
#ifdef FEATURE_WIFI_ENABLED
    wifiManager.update();
#endif

    // ---- Scanner UART update (non-blocking, < 1 ms if idle) ----
    scanner.update();

    // ---- Periodic heartbeat ----
    uint32_t now = millis();
    if (now - lastStatusAt >= STATUS_INTERVAL_MS) {
        lastStatusAt = now;
        LOG_INFO("MAIN", "Heartbeat | state=%s | scans=%lu",
                 deviceStatus.getStateString(),
                 deviceStatus.getScanCount());

#ifdef FEATURE_WIFI_ENABLED
        if (wifiManager.isConnected()) {
            httpClient.postHeartbeat(wifiManager.getRSSI(), millis() / 1000);
        }
#endif
    }

    // ---- Yield to FreeRTOS idle tasks (feeds WDT, allows BG tasks) ----
    vTaskDelay(pdMS_TO_TICKS(LOOP_YIELD_MS));
}