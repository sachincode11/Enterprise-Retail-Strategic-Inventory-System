/**
 * @file    GM67Scanner.h
 * @brief   Non-blocking driver for the GM67 barcode scanner over UART.
 *
 * DESIGN RATIONALE
 * ----------------
 * The original test code used a blocking while(GM67.available()) loop inside
 * loop().  This is fine for a proof-of-concept, but on a real device it can
 * starve other tasks and block status reporting.
 *
 * GM67Scanner solves this with a state-machine approach:
 *
 *   IDLE ──(first byte arrives)──► RECEIVING ──(CR received)──► COMPLETE
 *                                       │                           │
 *                                  (timeout)                   (processed)
 *                                       │                           │
 *                                    TIMEOUT ◄────────────────────IDLE
 *
 * update() is called from loop() every LOOP_YIELD_MS.  It reads one or more
 * bytes non-blocking and either appends them to an internal buffer or fires
 * the BarcodeProcessor when the terminator is found.
 *
 * UART Health / Auto-Recovery
 * ---------------------------
 * A watchdog timer tracks the last time any byte was received.  If the UART
 * has been silent for GM67_TIMEOUT_MS AND the device was previously scanning,
 * the driver triggers a recovery: it calls end() then begin() on the
 * HardwareSerial, updates DeviceStatus, and waits UART_RECOVERY_DELAY_MS
 * before retrying.  This handles cable disconnects and GM67 brownouts.
 *
 * SOLID:
 *   - Single Responsibility: UART read loop + line assembly + watchdog.
 *   - Dependency Inversion: takes a BarcodeProcessor reference, not concrete I/O.
 */

#pragma once

#include <Arduino.h>
#include "Config.h"
#include "DeviceStatus.h"
#include "BarcodeProcessor.h"

// =============================================================================
// GM67Scanner — non-blocking UART driver
// =============================================================================

class GM67Scanner {
public:
    // -------------------------------------------------------------------------
    // Constructor.
    // @param processor  Reference to the BarcodeProcessor that will validate
    //                   and dispatch completed barcode strings.
    // @param status     Reference to the shared DeviceStatus state machine.
    // -------------------------------------------------------------------------
    GM67Scanner(BarcodeProcessor& processor, DeviceStatus& status);

    // -------------------------------------------------------------------------
    // Initialise the HardwareSerial port.
    // Call once from setup().
    // @return true if the port was opened successfully.
    // -------------------------------------------------------------------------
    bool begin();

    // -------------------------------------------------------------------------
    // Gracefully close the UART port.
    // -------------------------------------------------------------------------
    void end();

    // -------------------------------------------------------------------------
    // Non-blocking update — call every loop iteration.
    //
    // Internally:
    //   1. Drains all available bytes from the UART FIFO.
    //   2. Appends printable characters to _lineBuffer.
    //   3. On CR (terminator), passes the assembled line to BarcodeProcessor.
    //   4. Runs the UART watchdog check.
    // -------------------------------------------------------------------------
    void update();

    // -------------------------------------------------------------------------
    // Returns true if the UART port is open and the GM67 appears healthy.
    // -------------------------------------------------------------------------
    bool isHealthy() const;

    // -------------------------------------------------------------------------
    // Returns the number of raw bytes received since boot (including CR bytes).
    // -------------------------------------------------------------------------
    uint32_t getBytesReceived() const;

    // -------------------------------------------------------------------------
    // Manually trigger a UART recovery attempt (e.g., called from a watchdog).
    // -------------------------------------------------------------------------
    void recover();

private:
    HardwareSerial  _serial;            ///< HardwareSerial(2) instance
    BarcodeProcessor& _processor;       ///< Validates & dispatches barcodes
    DeviceStatus&   _status;            ///< Shared device state machine

    // ---- Line assembly buffer ----
    char     _lineBuffer[GM67_MAX_BARCODE_LEN + 1]; ///< +1 for null terminator
    uint8_t  _bufferPos;                ///< Write index into _lineBuffer

    // ---- UART watchdog ----
    uint32_t _lastByteReceivedAt;       ///< millis() of last received byte
    uint32_t _lastWatchdogCheckAt;      ///< millis() of last watchdog tick
    bool     _healthy;                  ///< Current UART health flag
    uint32_t _bytesReceived;            ///< Lifetime byte counter

    // ---- Recovery state ----
    bool     _recovering;               ///< True while a recovery is pending
    uint32_t _recoveryStartedAt;        ///< millis() when recovery began

    // ---- Private helpers ----

    /// Read all available bytes from the UART FIFO (non-blocking).
    void _drainFifo();

    /// Process a single incoming character — append to buffer or dispatch.
    void _handleByte(char c);

    /// Dispatch the assembled _lineBuffer to the BarcodeProcessor, then reset.
    void _dispatchLine();

    /// Reset the line buffer to empty state.
    void _clearBuffer();

    /// Run the UART watchdog — triggers recovery if the port goes silent.
    void _runWatchdog();

    /// Perform the actual UART re-initialisation sequence.
    void _doRecover();
};
