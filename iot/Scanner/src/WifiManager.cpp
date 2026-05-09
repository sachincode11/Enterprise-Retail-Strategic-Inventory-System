/**
 * @file    WifiManager.cpp
 * @brief   Non-blocking WiFi connection and watchdog implementation.
 */

#include "WifiManager.h"
#include "Logger.h"

static const char* TAG = "WIFI";

// =============================================================================
// begin() — called once from setup()
// =============================================================================

bool WifiManager::begin(const char* ssid, const char* password) {
    _ssid     = ssid;
    _password = password;

    LOG_INFO(TAG, "Connecting to SSID: %s", _ssid);

    // Set station mode explicitly — ensures we don't inherit AP mode from OTA.
    WiFi.mode(WIFI_STA);
    WiFi.begin(_ssid, _password);

    uint32_t start = millis();
    while (WiFi.status() != WL_CONNECTED) {
        if ((millis() - start) >= WIFI_CONNECT_TIMEOUT_MS) {
            LOG_ERROR(TAG, "Connection timeout after %lu ms", WIFI_CONNECT_TIMEOUT_MS);
            _connected = false;
            return false;
        }
        // Yield to FreeRTOS during the connection handshake.
        vTaskDelay(pdMS_TO_TICKS(250));
        Serial.print('.');
    }
    Serial.println();

    _connected = true;
    _lastWatchdogAt = millis();

    LOG_INFO(TAG, "Connected!  IP=%s  RSSI=%d dBm",
             WiFi.localIP().toString().c_str(), WiFi.RSSI());
    return true;
}

// =============================================================================
// update() — called every loop() iteration
// =============================================================================

void WifiManager::update() {
    uint32_t now = millis();
    if ((now - _lastWatchdogAt) < WIFI_WATCHDOG_INTERVAL_MS) return;
    _lastWatchdogAt = now;

    bool currentlyConnected = (WiFi.status() == WL_CONNECTED);

    if (!currentlyConnected && _connected) {
        // Connection was lost — log and attempt silent reconnect.
        LOG_WARN(TAG, "WiFi dropped — attempting reconnect #%u", _reconnectCount + 1);
        _connected = false;
        _reconnect();
    } else if (currentlyConnected && !_connected) {
        // Reconnect succeeded since last watchdog tick.
        _connected = true;
        LOG_INFO(TAG, "Reconnected!  IP=%s  RSSI=%d dBm",
                 WiFi.localIP().toString().c_str(), WiFi.RSSI());
    } else if (currentlyConnected) {
        LOG_DEBUG(TAG, "OK  IP=%s  RSSI=%d dBm",
                  WiFi.localIP().toString().c_str(), WiFi.RSSI());
    }
}

// =============================================================================
// Public accessors
// =============================================================================

bool WifiManager::isConnected() const {
    return (WiFi.status() == WL_CONNECTED);
}

String WifiManager::getIP() const {
    return isConnected() ? WiFi.localIP().toString() : String("0.0.0.0");
}

int8_t WifiManager::getRSSI() const {
    return isConnected() ? (int8_t)WiFi.RSSI() : 0;
}

uint16_t WifiManager::getReconnectCount() const {
    return _reconnectCount;
}

// =============================================================================
// Private: _reconnect
// =============================================================================

void WifiManager::_reconnect() {
    _reconnectCount++;
    // WiFi.reconnect() re-uses the stored credentials — no need to pass them.
    WiFi.reconnect();
    // The actual association is async; update() will detect success next tick.
}
