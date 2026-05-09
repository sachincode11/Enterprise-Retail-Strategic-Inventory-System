/**
 * @file    DeviceStatus.h
 * @brief   Device health state machine for the ESP32 scanner node.
 *
 * DESIGN RATIONALE
 * ----------------
 * Instead of scattered boolean flags, all health state is managed through a
 * typed enum and a single DeviceStatus object.  Any module can query or update
 * the device state without knowing about other modules.
 *
 * The state machine is deliberately simple for an MCU context:
 *
 *    INITIALISING → READY ←→ SCANNING
 *                      ↓
 *                   UART_ERROR → RECOVERING → READY
 *                      ↓
 *                   FAULT (terminal, requires reboot)
 *
 * SOLID:
 *   - Single Responsibility: only tracks and transitions device health state.
 *   - Open/Closed: add new states without modifying existing transition logic.
 */

#pragma once

#include <Arduino.h>
#include <cstdint>

// =============================================================================
// State enumeration
// =============================================================================

enum class DeviceState : uint8_t {
    INITIALISING = 0,   ///< Boot sequence, peripherals not yet ready
    READY,              ///< Idle, waiting for barcode scans
    SCANNING,           ///< Actively reading bytes from GM67
    UART_ERROR,         ///< UART health check failed — attempting recovery
    RECOVERING,         ///< UART re-init in progress
    FAULT               ///< Unrecoverable error; system needs manual reset
};

// =============================================================================
// DeviceStatus — singleton-style status tracker
// =============================================================================

class DeviceStatus {
public:
    DeviceStatus();

    // ---- State accessors ----

    /// Returns the current device state.
    DeviceState getState() const;

    /// Returns a human-readable string for the current state (for logging).
    const char* getStateString() const;

    /// Returns true if the device is healthy enough to process scans.
    bool isOperational() const;

    /// Returns true if the UART is currently in a recovery attempt.
    bool isRecovering() const;

    // ---- State transitions ----
    // These methods enforce valid state transitions.  Calling an invalid
    // transition is silently ignored (guards against logic bugs).

    void setReady();
    void setScanning();
    void setUartError();
    void setRecovering();
    void setFault();

    // ---- Counters ----

    /// Increments the lifetime scan counter.
    void incrementScanCount();

    /// Returns total successful scans since boot.
    uint32_t getScanCount() const;

    /// Increments the UART recovery attempt counter.
    void incrementRecoveryCount();

    /// Returns total UART recovery attempts since boot.
    uint16_t getRecoveryCount() const;

    /// Returns milliseconds elapsed since last state change.
    uint32_t getTimeInCurrentState() const;

private:
    DeviceState _state;
    uint32_t    _stateEnteredAt;    ///< millis() when state last changed
    uint32_t    _scanCount;
    uint16_t    _recoveryCount;

    /// Internal helper — updates state and resets the state timer.
    void _transition(DeviceState next);
};
