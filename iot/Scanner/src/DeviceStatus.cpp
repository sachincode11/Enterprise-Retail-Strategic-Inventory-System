/**
 * @file    DeviceStatus.cpp
 * @brief   Implementation of the DeviceStatus state machine.
 *
 * The _transition() helper is the single choke-point for all state changes.
 * Every public setter routes through it, which makes the code easy to audit:
 * grep for "_transition" and you see every possible state change in one place.
 */

#include "DeviceStatus.h"
#include "Logger.h"

static const char* TAG = "STATUS";

// =============================================================================
// Constructor
// =============================================================================

DeviceStatus::DeviceStatus()
    : _state(DeviceState::INITIALISING),
      _stateEnteredAt(0),
      _scanCount(0),
      _recoveryCount(0) {
    // _stateEnteredAt is set properly when begin() fires millis() is valid.
    // We leave it 0 here because millis() == 0 at boot anyway.
}

// =============================================================================
// State accessors
// =============================================================================

DeviceState DeviceStatus::getState() const {
    return _state;
}

const char* DeviceStatus::getStateString() const {
    switch (_state) {
        case DeviceState::INITIALISING: return "INITIALISING";
        case DeviceState::READY:        return "READY";
        case DeviceState::SCANNING:     return "SCANNING";
        case DeviceState::UART_ERROR:   return "UART_ERROR";
        case DeviceState::RECOVERING:   return "RECOVERING";
        case DeviceState::FAULT:        return "FAULT";
        default:                        return "UNKNOWN";
    }
}

bool DeviceStatus::isOperational() const {
    // The device can accept scans when it is READY or actively SCANNING.
    return (_state == DeviceState::READY || _state == DeviceState::SCANNING);
}

bool DeviceStatus::isRecovering() const {
    return (_state == DeviceState::RECOVERING);
}

// =============================================================================
// State transitions
// Each public setter validates the transition is sensible, then delegates
// to _transition().  Invalid transitions are logged but not applied — this
// prevents undefined states caused by concurrency or logic bugs.
// =============================================================================

void DeviceStatus::setReady() {
    // READY is reachable from any state (covers init, post-recovery, etc.)
    _transition(DeviceState::READY);
}

void DeviceStatus::setScanning() {
    if (_state == DeviceState::READY || _state == DeviceState::SCANNING) {
        _transition(DeviceState::SCANNING);
    } else {
        LOG_WARN(TAG, "Ignoring SCANNING transition from state %s", getStateString());
    }
}

void DeviceStatus::setUartError() {
    // Can report a UART error from any operational or recovering state.
    if (_state != DeviceState::FAULT) {
        _transition(DeviceState::UART_ERROR);
    }
}

void DeviceStatus::setRecovering() {
    if (_state == DeviceState::UART_ERROR) {
        _recoveryCount++;
        _transition(DeviceState::RECOVERING);
    } else {
        LOG_WARN(TAG, "Ignoring RECOVERING transition from state %s", getStateString());
    }
}

void DeviceStatus::setFault() {
    // FAULT is terminal — no transition out of it (requires reboot).
    _transition(DeviceState::FAULT);
    LOG_ERROR(TAG, "Device entered FAULT state — manual reset required");
}

// =============================================================================
// Counters
// =============================================================================

void DeviceStatus::incrementScanCount() {
    _scanCount++;
}

uint32_t DeviceStatus::getScanCount() const {
    return _scanCount;
}

void DeviceStatus::incrementRecoveryCount() {
    _recoveryCount++;
}

uint16_t DeviceStatus::getRecoveryCount() const {
    return _recoveryCount;
}

uint32_t DeviceStatus::getTimeInCurrentState() const {
    return millis() - _stateEnteredAt;
}

// =============================================================================
// Private helpers
// =============================================================================

void DeviceStatus::_transition(DeviceState next) {
    if (_state == next) return;  // No-op — already in this state.

    LOG_DEBUG(TAG, "State: %s → %s  (after %lu ms)",
              getStateString(),
              // Temporarily compute the next state name inline:
              [](DeviceState s) -> const char* {
                  switch (s) {
                      case DeviceState::INITIALISING: return "INITIALISING";
                      case DeviceState::READY:        return "READY";
                      case DeviceState::SCANNING:     return "SCANNING";
                      case DeviceState::UART_ERROR:   return "UART_ERROR";
                      case DeviceState::RECOVERING:   return "RECOVERING";
                      case DeviceState::FAULT:        return "FAULT";
                      default:                        return "UNKNOWN";
                  }
              }(next),
              getTimeInCurrentState());

    _state = next;
    _stateEnteredAt = millis();
}
