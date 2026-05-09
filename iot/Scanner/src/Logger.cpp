/**
 * @file    Logger.cpp
 * @brief   Implementation of the Logger utility class.
 *
 * All output goes to the USB-Serial port (Serial / UART0).
 * Format:  [TIMESTAMP] [LEVEL][TAG] message
 * Example: [00012345] [I][GM67] Scanner initialised on UART2
 *
 * va_list / vsnprintf is used to support printf-style format strings while
 * keeping the implementation on the stack (no heap allocation).
 */

#include "Logger.h"
#include <stdarg.h>
#include <stdio.h>

// Internal formatting buffer.  Lives in .bss (zero-init), not on the stack.
// 256 bytes is generous for embedded log lines and safe on ESP32's 320 KB DRAM.
static char _logBuf[256];

// =============================================================================
// Public methods
// =============================================================================

void Logger::begin(uint32_t baud) {
    Serial.begin(baud);
    // Give the host USB–CDC stack time to enumerate before printing.
    delay(100);
}

void Logger::error(const char* tag, const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    log('E', tag, fmt, args);
    va_end(args);
}

void Logger::warn(const char* tag, const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    log('W', tag, fmt, args);
    va_end(args);
}

void Logger::info(const char* tag, const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    log('I', tag, fmt, args);
    va_end(args);
}

void Logger::debug(const char* tag, const char* fmt, ...) {
    va_list args;
    va_start(args, fmt);
    log('D', tag, fmt, args);
    va_end(args);
}

void Logger::divider() {
    Serial.println(F("──────────────────────────────────────────────"));
}

void Logger::banner() {
    divider();
    Serial.printf("  Device  : %s\n", FW_DEVICE_ID);
    Serial.printf("  Firmware: v%s  (%s)\n", FW_VERSION, FW_BUILD_DATE);
    Serial.printf("  UART    : HW%d  RX=GPIO%d  TX=GPIO%d  %u baud\n",
                  GM67_UART_NUM, GM67_RX_PIN, GM67_TX_PIN, GM67_BAUD_RATE);
    Serial.printf("  LogLevel: %d\n", LOG_LEVEL);
    divider();
}

// =============================================================================
// Private helpers
// =============================================================================

void Logger::log(char level, const char* tag, const char* fmt, va_list args) {
    // Format the user message into the shared buffer.
    vsnprintf(_logBuf, sizeof(_logBuf), fmt, args);

#if LOG_TIMESTAMPS
    // millis() rolls over after ~49 days — acceptable for an embedded node.
    Serial.printf("[%08lu] [%c][%s] %s\n", millis(), level, tag, _logBuf);
#else
    Serial.printf("[%c][%s] %s\n", level, tag, _logBuf);
#endif
}
