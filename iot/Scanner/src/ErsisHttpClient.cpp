/**
 * @file    ErsisHttpClient.cpp
 * @brief   HTTP POST implementation for the ERSIS IoT scan endpoint.
 */

#include "ErsisHttpClient.h"
#include "WifiManager.h"
#include "Logger.h"

static const char* TAG    = "HTTP";
static const char* SCAN_URL = API_BASE_URL "/api/v1/iot/scan";

ScanResponse ErsisHttpClient::postScan(const String& barcode) {
    ScanResponse resp { HttpResult::UNKNOWN, 0, "", 0.0f, 0 };

    if (WiFi.status() != WL_CONNECTED) {
        LOG_WARN(TAG, "WiFi down — skipping HTTP post for: %s", barcode.c_str());
        resp.result = HttpResult::WIFI_DOWN;
        return resp;
    }

    // Use ::HTTPClient to explicitly refer to the system library class
    ::HTTPClient http;
    http.setTimeout(HTTP_TIMEOUT_MS);
    http.begin(SCAN_URL);
    http.addHeader("Content-Type",  "application/json");
    http.addHeader("X-IoT-Secret",  IOT_DEVICE_SECRET);
    http.addHeader("X-Device-Id",   FW_DEVICE_ID);

    String payload = _buildPayload(barcode);
    LOG_DEBUG(TAG, "POST %s  body=%s", SCAN_URL, payload.c_str());

    int code = http.POST(payload);
    resp.httpCode = code;

    if (code <= 0) {
        LOG_ERROR(TAG, "HTTP error: %s (%d)", http.errorToString(code).c_str(), code);
        // Using literal values as some older ESP32 cores don't define the HTTPC_ERROR constants in headers
        resp.result = (code == -1) ? HttpResult::TIMEOUT : HttpResult::UNKNOWN;
        http.end();
        return resp;
    }

    String body = http.getString();
    http.end();

    LOG_DEBUG(TAG, "Response %d: %s", code, body.c_str());

    if (code == 200 || code == 201) {
        resp.result = HttpResult::OK;
        auto extract = [&](const char* key) -> String {
            String search = String("\"") + key + "\":";
            int idx = body.indexOf(search);
            if (idx < 0) return "";
            idx += search.length();
            while (idx < (int)body.length() && (body[idx] == ' ' || body[idx] == '"' || body[idx] == ':')) idx++;
            int end = idx;
            while (end < (int)body.length() && body[end] != '"' && body[end] != ',' && body[end] != '}') end++;
            return body.substring(idx, end);
        };

        resp.productName = extract("product_name");
        resp.unitPrice   = extract("unit_price").toFloat();
        resp.stockQty    = extract("stock").toInt();

        LOG_INFO(TAG, "Scan OK → %s  @ %.2f  stock=%d",
                 resp.productName.c_str(), resp.unitPrice, resp.stockQty);

    } else if (code == 404) {
        resp.result = HttpResult::NOT_FOUND;
        LOG_WARN(TAG, "Barcode '%s' not in catalogue (404)", barcode.c_str());
    } else if (code >= 500) {
        resp.result = HttpResult::SERVER_ERROR;
    } else {
        resp.result = HttpResult::CLIENT_ERROR;
    }

    return resp;
}

void ErsisHttpClient::postHeartbeat(int rssi, uint32_t uptimeS) {
    if (WiFi.status() != WL_CONNECTED) return;

    ::HTTPClient http;
    char url[512]; // Increased size to be safe
    String ip = WiFi.localIP().toString();
    
    // Include scan count in heartbeat so the UI updates live scan history
    snprintf(url, sizeof(url),
             "%s/api/v1/iot/health?device_id=%s&store_id=%s&ip_address=%s&rssi=%d&scans=%lu&uptime_s=%lu&firmware=%s",
             API_BASE_URL, FW_DEVICE_ID, API_STORE_ID, 
             ip.c_str(), rssi, deviceStatus.getScanCount(), uptimeS, FW_VERSION);

    http.begin(url);
    int code = http.GET();
    if (code > 0) {
        LOG_INFO(TAG, "Heartbeat OK (Code: %d, RSSI: %d)", code, rssi);
    } else {
        LOG_ERROR(TAG, "Heartbeat FAILED: %s", http.errorToString(code).c_str());
    }
    http.end();
}


const char* ErsisHttpClient::resultString(HttpResult r) {
    switch (r) {
        case HttpResult::OK:           return "OK";
        case HttpResult::NOT_FOUND:    return "NOT_FOUND";
        case HttpResult::WIFI_DOWN:    return "WIFI_DOWN";
        case HttpResult::TIMEOUT:      return "TIMEOUT";
        case HttpResult::SERVER_ERROR: return "SERVER_ERROR";
        case HttpResult::CLIENT_ERROR: return "CLIENT_ERROR";
        default:                       return "UNKNOWN";
    }
}

String ErsisHttpClient::_buildPayload(const String& barcode) const {
    char buf[256];
    snprintf(buf, sizeof(buf),
             "{\"barcode\":\"%s\",\"device_id\":\"%s\",\"store_id\":\"%s\"}",
             barcode.c_str(), FW_DEVICE_ID, API_STORE_ID);
    return String(buf);
}
