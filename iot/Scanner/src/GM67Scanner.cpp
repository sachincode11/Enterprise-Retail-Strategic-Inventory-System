/**
 * @file    GM67Scanner.cpp
 * @brief   Implementation of the non-blocking GM67 UART driver.
 *
 * KEY DESIGN DECISIONS
 * --------------------
 *
 * 1. No blocking while() loop
 *    update() reads only the bytes currently in the UART FIFO and returns.
 *    If 0 bytes are available, it returns in microseconds.  This keeps the
 *    main loop responsive for status reporting, WiFi ticks, etc.
 *
 * 2. Static char buffer, not String
 *    _lineBuffer is a fixed-size char array allocated at compile time.
 *    Using String would cause heap fragmentation on an MCU — a known source
 *    of hard-to-reproduce crashes in long-running Arduino firmware.
 *
 * 3. Watchdog with two-phase recovery
 *    Phase 1 (UART_ERROR): flagged immediately when silence > GM67_TIMEOUT_MS.
 *    Phase 2 (RECOVERING): begin() + end() cycle, then waits
 *    UART_RECOVERY_DELAY_MS before returning to READY.
 *    This prevents a tight recovery loop that could lock up the UART hardware.
 *
 * 4. HardwareSerial initialised in constructor member list
 *    `_serial(GM67_UART_NUM)` ensures the correct UART peripheral is used
 *    regardless of where the object is instantiated.
 */

#include "GM67Scanner.h"
#include "Logger.h"

static const char* TAG = "GM67";

// =============================================================================
// Constructor
// =============================================================================

GM67Scanner::GM67Scanner(BarcodeProcessor& processor, DeviceStatus& status)
    : _serial(GM67_UART_NUM),       // Bind to HardwareSerial port 2
      _processor(processor),
      _status(status),
      _bufferPos(0),
      _lastByteReceivedAt(0),
      _lastWatchdogCheckAt(0),
      _healthy(false),
      _bytesReceived(0),
      _recovering(false),
      _recoveryStartedAt(0) {
    _clearBuffer();
}

// =============================================================================
// Public: begin
// =============================================================================

bool GM67Scanner::begin() {
    LOG_INFO(TAG, "Initialising UART%d  RX=GPIO%d TX=GPIO%d @ %lu baud",
             GM67_UART_NUM, GM67_RX_PIN, GM67_TX_PIN, GM67_BAUD_RATE);

    // begin() configures the GPIO mux and enables the UART peripheral.
    // Parameters: baud, config, rxPin, txPin
    _serial.begin(GM67_BAUD_RATE, GM67_SERIAL_CFG, GM67_RX_PIN, GM67_TX_PIN);

    // Small stabilisation pause — the GM67 needs ~50 ms to respond after power.
    // This is the ONLY intentional delay in the entire firmware.
    delay(100);

    _healthy             = true;
    _lastByteReceivedAt  = millis();
    _lastWatchdogCheckAt = millis();
    _clearBuffer();

    LOG_INFO(TAG, "UART ready");
    return true;
}

// =============================================================================
// Public: end
// =============================================================================

void GM67Scanner::end() {
    _serial.end();
    _healthy = false;
    LOG_INFO(TAG, "UART closed");
}

// =============================================================================
// Public: update  (called every loop iteration)
// =============================================================================

void GM67Scanner::update() {
    // If we are mid-recovery, check whether the wait period has expired.
    if (_recovering) {
        if ((millis() - _recoveryStartedAt) >= UART_RECOVERY_DELAY_MS) {
            _doRecover();
        }
        return;  // Do not attempt to read while recovering.
    }

    // Drain whatever bytes are in the hardware FIFO right now.
    _drainFifo();

    // Run the watchdog at a reduced frequency to avoid log spam.
    if ((millis() - _lastWatchdogCheckAt) >= UART_WATCHDOG_INTERVAL_MS) {
        _lastWatchdogCheckAt = millis();
        _runWatchdog();
    }
}

// =============================================================================
// Public: isHealthy
// =============================================================================

bool GM67Scanner::isHealthy() const {
    return _healthy && !_recovering;
}

// =============================================================================
// Public: getBytesReceived
// =============================================================================

uint32_t GM67Scanner::getBytesReceived() const {
    return _bytesReceived;
}

// =============================================================================
// Public: recover (manual trigger)
// =============================================================================

void GM67Scanner::recover() {
    LOG_WARN(TAG, "Manual recovery triggered");
    _status.setUartError();
    _status.setRecovering();
    _recovering          = true;
    _recoveryStartedAt   = millis();
    _healthy             = false;
    _clearBuffer();
    _serial.end();
}

// =============================================================================
// Private: _drainFifo
// =============================================================================

void GM67Scanner::_drainFifo() {
    // Read all bytes currently available — never block waiting for more.
    while (_serial.available() > 0) {
        char c = (char)_serial.read();
        _bytesReceived++;
        _lastByteReceivedAt = millis();

        // Mark as scanning on first byte received.
        if (_status.getState() == DeviceState::READY) {
            _status.setScanning();
        }

        _handleByte(c);
    }
}

// =============================================================================
// Private: _handleByte
// =============================================================================

void GM67Scanner::_handleByte(char c) {
    // The GM67 terminates every barcode with CR (\r).
    // Some firmware versions send CR+LF — we treat both CR and LF as terminators
    // and ignore the second one (which arrives as an empty line and is rejected
    // by BarcodeProcessor::validate as TOO_SHORT).
    if (c == GM67_TERMINATOR || c == '\n') {
        if (_bufferPos > 0) {
            _dispatchLine();
        }
        return;
    }

    // Overflow guard — discard the byte and warn rather than overflow the buffer.
    if (_bufferPos >= GM67_MAX_BARCODE_LEN) {
        LOG_WARN(TAG, "Buffer overflow — discarding character 0x%02X", (uint8_t)c);
        return;
    }

    _lineBuffer[_bufferPos++] = c;
    _lineBuffer[_bufferPos]   = '\0';  // Keep null-terminated at all times.
}

// =============================================================================
// Private: _dispatchLine
// =============================================================================

void GM67Scanner::_dispatchLine() {
    // Build a String from the null-terminated buffer and pass it to
    // BarcodeProcessor.  String is heap-allocated here only momentarily.
    String raw(_lineBuffer);

    LOG_DEBUG(TAG, "Raw line: [%s]  (%u bytes)", _lineBuffer, _bufferPos);

    _status.incrementScanCount();
    _processor.process(raw);

    // Return to READY state after processing — SCANNING is a transient state.
    _status.setReady();

    _clearBuffer();
}

// =============================================================================
// Private: _clearBuffer
// =============================================================================

void GM67Scanner::_clearBuffer() {
    memset(_lineBuffer, 0, sizeof(_lineBuffer));
    _bufferPos = 0;
}

// =============================================================================
// Private: _runWatchdog
// =============================================================================

void GM67Scanner::_runWatchdog() {
    uint32_t silenceMs = millis() - _lastByteReceivedAt;

    // Only trigger a watchdog recovery if we are in the MIDDLE of a scan 
    // (buffer is not empty) and the data has stalled. 
    // Barcode scanners are expected to be silent for long periods when idle.
    if (_bufferPos > 0 && silenceMs > GM67_TIMEOUT_MS) {
        LOG_WARN(TAG, "Scan data stalled for %lu ms — clearing buffer", silenceMs);
        _clearBuffer();
        _status.setReady();
    } else {
        LOG_DEBUG(TAG, "Watchdog OK  silence=%lu ms  rx=%lu bytes",
                  silenceMs, _bytesReceived);
    }
}

// =============================================================================
// Private: _doRecover  (called after UART_RECOVERY_DELAY_MS has elapsed)
// =============================================================================

void GM67Scanner::_doRecover() {
    LOG_INFO(TAG, "Recovery attempt #%u — reinitialising UART",
             _status.getRecoveryCount());

    // Re-open the serial port with the same parameters.
    _serial.begin(GM67_BAUD_RATE, GM67_SERIAL_CFG, GM67_RX_PIN, GM67_TX_PIN);
    delay(100);  // Stabilisation — same rationale as begin().

    _healthy             = true;
    _recovering          = false;
    _lastByteReceivedAt  = millis();   // Reset silence timer.
    _clearBuffer();

    _status.setReady();
    _processor.resetDebounce();        // Clear stale debounce state.

    LOG_INFO(TAG, "UART recovery complete — status: READY");
}
