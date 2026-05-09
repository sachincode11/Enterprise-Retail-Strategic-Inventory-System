/**
 * @file    Logger.h
 * @brief   Lightweight, level-aware debug logger for ESP32 firmware.
 *
 * DESIGN RATIONALE
 * ----------------
 * Embedded systems need logs that can be completely compiled away in production
 * to save both flash and execution time.  This Logger uses preprocessor macros
 * so that calls below the compile-time LOG_LEVEL become zero-cost no-ops.
 *
 * The Logger class wraps Arduino's Serial and adds:
 *   - Level-prefixed output  (e.g. "[INFO]", "[ERROR]")
 *   - Optional millisecond timestamps
 *   - Tag-based namespacing  (e.g. "[GM67]", "[UART]")
 *   - Completely stripped in production when LOG_LEVEL == 0
 *
 * Usage:
 *   Logger::info("GM67", "Scanner ready");
 *   Logger::error("UART", "Recovery failed after %d ms", elapsed);
 *
 * SOLID: Single Responsibility — only handles log formatting and output.
 */

#pragma once

#include <Arduino.h>
#include "Config.h"

// =============================================================================
// Log-level convenience macros (compile-time zero-cost guards)
// =============================================================================

// Macro wrappers let the compiler eliminate dead code branches entirely.
// Without them, even disabled log calls would still evaluate their arguments.

#if LOG_LEVEL >= 1
  #define LOG_ERROR(tag, fmt, ...)  Logger::error(tag, fmt, ##__VA_ARGS__)
#else
  #define LOG_ERROR(tag, fmt, ...)  ((void)0)
#endif

#if LOG_LEVEL >= 2
  #define LOG_WARN(tag, fmt, ...)   Logger::warn(tag, fmt, ##__VA_ARGS__)
#else
  #define LOG_WARN(tag, fmt, ...)   ((void)0)
#endif

#if LOG_LEVEL >= 3
  #define LOG_INFO(tag, fmt, ...)   Logger::info(tag, fmt, ##__VA_ARGS__)
#else
  #define LOG_INFO(tag, fmt, ...)   ((void)0)
#endif

#if LOG_LEVEL >= 4
  #define LOG_DEBUG(tag, fmt, ...)  Logger::debug(tag, fmt, ##__VA_ARGS__)
#else
  #define LOG_DEBUG(tag, fmt, ...)  ((void)0)
#endif

// =============================================================================
// Logger class — static-only (no instantiation required)
// =============================================================================

class Logger {
public:
    // -------------------------------------------------------------------------
    // Initialise the underlying serial port.
    // Must be called once in setup() before any log calls.
    // -------------------------------------------------------------------------
    static void begin(uint32_t baud = SERIAL_DEBUG_BAUD);

    // -------------------------------------------------------------------------
    // Named log-level methods.
    // Use the macros above rather than calling these directly — the macros
    // ensure zero overhead when that level is compiled out.
    // -------------------------------------------------------------------------
    static void error(const char* tag, const char* fmt, ...);
    static void warn (const char* tag, const char* fmt, ...);
    static void info (const char* tag, const char* fmt, ...);
    static void debug(const char* tag, const char* fmt, ...);

    // -------------------------------------------------------------------------
    // Print a horizontal divider line (useful in setup() banners).
    // -------------------------------------------------------------------------
    static void divider();

    // -------------------------------------------------------------------------
    // Print a startup banner with firmware version and device ID.
    // -------------------------------------------------------------------------
    static void banner();

private:
    // Private helper — formats and writes a single log line.
    static void log(char level, const char* tag, const char* fmt, va_list args);
};
