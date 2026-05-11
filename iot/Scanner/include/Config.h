/**
 * @file    Config.h
 * @brief   Central compile-time configuration for the ESP32 GM67 Scanner node.
 *
 * DESIGN RATIONALE
 * ----------------
 * All magic numbers live here. Changing a pin, baud rate, or timeout means
 * editing exactly one file.  Every other module #includes this header and
 * references named constants — no hard-coded literals anywhere in the code.
 *
 * All values are `constexpr` (evaluated at compile time) or `#define` macros
 * where the preprocessor is the right tool (e.g. conditional compilation).
 *
 * SOLID: Open/Closed — add new constants without modifying callers.
 */

#pragma once

#include <cstdint>

// =============================================================================
// FIRMWARE IDENTITY
// =============================================================================

constexpr char     FW_DEVICE_ID[]   = "ERSIS-SCANNER-01";  ///< Unique node ID
constexpr char     FW_VERSION[]     = "1.0.0";              ///< Semantic version
constexpr char     FW_BUILD_DATE[]  = __DATE__;             ///< Injected by compiler

// =============================================================================
// UART — Debug / USB Serial (Serial0)
// =============================================================================

constexpr uint32_t SERIAL_DEBUG_BAUD = 115200U;

// =============================================================================
// UART — GM67 Barcode Scanner (HardwareSerial 2)
// =============================================================================

constexpr uint8_t  GM67_UART_NUM    = 2;        ///< HardwareSerial port index
constexpr uint8_t  GM67_RX_PIN      = 26;       ///< ESP32 GPIO receiving GM67 TX
constexpr uint8_t  GM67_TX_PIN      = 27;       ///< ESP32 GPIO driving  GM67 RX
constexpr uint32_t GM67_BAUD_RATE   = 115200U;
constexpr uint32_t GM67_SERIAL_CFG  = SERIAL_8N1;

// =============================================================================
// GM67 PROTOCOL
// =============================================================================

/// Maximum barcode string length the GM67 can produce (EAN-128 + margin).
constexpr uint8_t  GM67_MAX_BARCODE_LEN = 128;

/// The GM67 terminates every barcode with CR (\r).  Some firmware versions
/// append CR+LF; we handle both by treating \r as the primary delimiter.
constexpr char     GM67_TERMINATOR      = '\r';

/// Minimum printable barcode length (single digit barcodes are invalid in retail).
constexpr uint8_t  GM67_MIN_BARCODE_LEN = 4;

// =============================================================================
// TIMING (all in milliseconds)
// =============================================================================

/// How long the main loop yields to the RTOS scheduler between iterations.
/// Keeps the watchdog fed and allows FreeRTOS idle tasks to run.
constexpr uint32_t LOOP_YIELD_MS           = 10U;

/// Debounce window: ignore a second scan of the same barcode within this time.
constexpr uint32_t BARCODE_DEBOUNCE_MS     = 3000U;

/// If no byte arrives from the GM67 within this window, declare the UART stale.
constexpr uint32_t GM67_TIMEOUT_MS         = 5000U;

/// How often the UART watchdog checks scanner health.
constexpr uint32_t UART_WATCHDOG_INTERVAL_MS = 2000U;

/// How long to wait before attempting UART re-initialisation after a fault.
constexpr uint32_t UART_RECOVERY_DELAY_MS  = 3000U;

// =============================================================================
// BARCODE VALIDATION
// =============================================================================

/// Set of characters accepted as valid barcode payload (printable ASCII).
/// Control characters, null bytes, and non-ASCII are always rejected.
constexpr char VALID_BARCODE_CHARSET_START = 0x20;  ///< Space (inclusive)
constexpr char VALID_BARCODE_CHARSET_END   = 0x7E;  ///< Tilde (inclusive)

// =============================================================================
// LOGGING
// =============================================================================

/// Runtime log level thresholds (mirrors Arduino ESP32 log levels).
/// 0=None, 1=Error, 2=Warn, 3=Info, 4=Debug, 5=Verbose
#ifndef LOG_LEVEL
  #define LOG_LEVEL 3
#endif

/// Set to 1 to prefix every log line with a millisecond timestamp.
#define LOG_TIMESTAMPS 1

// =============================================================================
// WIFI CREDENTIALS  (override in .env or via build_flags in platformio.ini)
// =============================================================================
//
// SECURITY NOTE: Do NOT commit real credentials to git.
// Set them as build flags in platformio.ini:
//   build_flags = -DWIFI_SSID='"MyNetwork"' -DWIFI_PASSWORD='"secret"'
//
// If not set via build flags, the defaults below are used (safe for dev).

#ifndef WIFI_SSID
  #define WIFI_SSID     "ayurvedaoushadhalaya_2.4"
#endif

#ifndef WIFI_PASSWORD
  #define WIFI_PASSWORD "CLEB2D7787"
#endif

/// How long to wait for a WiFi connection before giving up (ms).
constexpr uint32_t WIFI_CONNECT_TIMEOUT_MS  = 15000U;

/// How often to check WiFi health and attempt reconnect if dropped.
constexpr uint32_t WIFI_WATCHDOG_INTERVAL_MS = 10000U;

// =============================================================================
// ERSIS API ENDPOINT
// =============================================================================
//
// The ESP32 posts each validated barcode to this endpoint.
// Endpoint: POST /api/v1/iot/scan
// The backend looks up the product, updates the scan log, and broadcasts
// the product via WebSocket to any connected cashier frontends.

#ifndef API_BASE_URL
  #define API_BASE_URL  "http://192.168.1.77:8000"
#endif

#ifndef API_STORE_ID
  #define API_STORE_ID  "1"
#endif

/// Shared secret between ESP32 and backend for IoT endpoint auth.
/// Set a proper random value in production via build_flags.
#ifndef IOT_DEVICE_SECRET
  #define IOT_DEVICE_SECRET "ersis-iot-dev-secret"
#endif

/// HTTP request timeout (ms). Keep short — we don't block the scanner loop.
constexpr uint32_t HTTP_TIMEOUT_MS = 5000U;

// =============================================================================
// FEATURE FLAGS (uncomment to enable)
// =============================================================================

#define FEATURE_WIFI_ENABLED    ///< Enable WiFi stack + HTTP REST integration
// #define FEATURE_MQTT_ENABLED    ///< Publish scans via MQTT (Phase 3)
// #define FEATURE_OTA_ENABLED     ///< Enable OTA firmware updates (Phase 3)
// #define FEATURE_FREERTOS_TASKS  ///< Dedicate FreeRTOS tasks per module (Phase 4)
