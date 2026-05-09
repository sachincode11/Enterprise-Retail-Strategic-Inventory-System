/**
 * @file    ErsisHttpClient.h
 * @brief   Lightweight HTTP POST wrapper for the ERSIS IoT scan endpoint.
 *
 * RENAMED from HttpClient.h to avoid conflict with Arduino's HTTPClient.h.
 */

#pragma once
#include <Arduino.h>
#include <HTTPClient.h> // The real system library
#include "Config.h"

enum class HttpResult : uint8_t {
    OK = 0,
    NOT_FOUND,
    WIFI_DOWN,
    TIMEOUT,
    SERVER_ERROR,
    CLIENT_ERROR,
    UNKNOWN
};

struct ScanResponse {
    HttpResult  result;
    int         httpCode;
    String      productName;
    float       unitPrice;
    int         stockQty;
};

class ErsisHttpClient {
public:
    ScanResponse postScan(const String& barcode);
    void postHeartbeat(int rssi, uint32_t uptimeS);
    static const char* resultString(HttpResult r);

private:
    String _buildPayload(const String& barcode) const;
};
