/**
 * @file    WifiManager.h
 * @brief   Non-blocking WiFi connection manager for ESP32.
 *
 * DESIGN RATIONALE
 * ----------------
 * WiFi.begin() is synchronous up to the point of issuing the association
 * request, but the actual association handshake happens asynchronously in
 * the ESP-IDF WiFi task.  Polling WiFi.status() in a non-blocking fashion
 * (with a timeout) lets the main loop remain responsive during connection.
 *
 * Responsibilities:
 *   - Connect to WiFi with a configurable timeout.
 *   - Run a background watchdog: if WiFi drops, attempt silent reconnect.
 *   - Expose connection status and IP address for logging/HTTP use.
 *
 * SOLID:
 *   - Single Responsibility: WiFi only. No HTTP, no MQTT.
 *   - Open/Closed: add captive-portal or WPS without changing callers.
 */

#pragma once
#include <Arduino.h>
#include <WiFi.h>
#include "Config.h"

class WifiManager {
public:
    // -------------------------------------------------------------------------
    // Attempt initial WiFi connection.  Call once from setup().
    // Blocks for up to WIFI_CONNECT_TIMEOUT_MS waiting for association.
    // Returns true if connected, false on timeout.
    // -------------------------------------------------------------------------
    bool begin(const char* ssid = WIFI_SSID,
               const char* password = WIFI_PASSWORD);

    // -------------------------------------------------------------------------
    // Non-blocking watchdog.  Call from loop().
    // Checks connection every WIFI_WATCHDOG_INTERVAL_MS and reconnects if lost.
    // -------------------------------------------------------------------------
    void update();

    // -------------------------------------------------------------------------
    // Returns true when WiFi is associated and has an IP address.
    // -------------------------------------------------------------------------
    bool isConnected() const;

    // -------------------------------------------------------------------------
    // Returns the current IP address string, or "0.0.0.0" if not connected.
    // -------------------------------------------------------------------------
    String getIP() const;

    // -------------------------------------------------------------------------
    // Returns the RSSI (signal strength) in dBm.  Returns 0 if not connected.
    // -------------------------------------------------------------------------
    int8_t getRSSI() const;

    // -------------------------------------------------------------------------
    // Returns how many reconnect attempts have been made since boot.
    // -------------------------------------------------------------------------
    uint16_t getReconnectCount() const;

private:
    const char* _ssid     = nullptr;
    const char* _password = nullptr;
    uint32_t    _lastWatchdogAt  = 0;
    uint16_t    _reconnectCount  = 0;
    bool        _connected       = false;

    // Perform a single reconnect attempt (non-blocking trigger only).
    void _reconnect();
};
