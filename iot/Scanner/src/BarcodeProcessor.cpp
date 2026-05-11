/**
 * @file    BarcodeProcessor.cpp
 * @brief   Implementation of barcode sanitisation, validation, and dispatch.
 *
 * process() is the main entry point.  It runs the full pipeline:
 *
 *   raw string
 *     → sanitise()     strip control chars & whitespace
 *     → validate()     length & charset check
 *     → _isDuplicate() debounce
 *     → _callback()    hand off to application layer
 *
 * Each stage is a pure static function (sanitise, validate) or a const member
 * (_isDuplicate), making them unit-testable in isolation without needing a
 * full BarcodeProcessor instance.
 */

#include "BarcodeProcessor.h"
#include "Logger.h"

static const char* TAG = "BCODE";

// =============================================================================
// Constructor
// =============================================================================

BarcodeProcessor::BarcodeProcessor(BarcodeCallback callback)
    : _callback(callback),
      _lastBarcode(""),
      _lastBarcodeTime(0) {
    // std::function is used so _callback can be a lambda, a free function,
    // or a std::bind expression — maximum flexibility for the caller.
}

// =============================================================================
// Main pipeline
// =============================================================================

ValidationResult BarcodeProcessor::process(const String& raw) {
    // 1. Copy and sanitise.
    String clean = raw;
    sanitise(clean);

    // 2. Validate.
    ValidationResult result = validate(clean);
    if (result != ValidationResult::OK) {
        LOG_WARN(TAG, "Rejected [%s]: %s", clean.c_str(), resultString(result));
        return result;
    }

    // 3. Debounce — reject if same barcode arrives within the debounce window.
    if (_isDuplicate(clean)) {
        LOG_DEBUG(TAG, "Duplicate suppressed: %s", clean.c_str());
        return ValidationResult::DUPLICATE;
    }

    // 4. Accept — update state and invoke callback.
    _lastBarcode     = clean;
    _lastBarcodeTime = millis();

    LOG_INFO(TAG, "Accepted: %s  (%u chars)", clean.c_str(), clean.length());

    // Invoke the user-supplied callback (application layer).
    if (_callback) {
        _callback(clean);
    }

    return ValidationResult::OK;
}

// =============================================================================
// Static utility: sanitise
// =============================================================================

void BarcodeProcessor::sanitise(String& s) {
    // --- Strip leading non-printable characters ---
    uint16_t start = 0;
    while (start < s.length() && (uint8_t)s[start] < 0x20) {
        start++;
    }

    // --- Strip trailing non-printable characters and whitespace ---
    int16_t end = (int16_t)s.length() - 1;
    while (end >= (int16_t)start && (uint8_t)s[end] <= 0x20) {
        end--;
    }

    // Reassign the trimmed substring (O(n) copy, acceptable for ≤128 chars).
    if (start > 0 || end < (int16_t)s.length() - 1) {
        s = s.substring(start, (uint16_t)(end + 1));
    }
}

// =============================================================================
// Static utility: validate
// =============================================================================

ValidationResult BarcodeProcessor::validate(const String& s) {
    // Empty after sanitisation?
    if (s.length() == 0) {
        return ValidationResult::EMPTY;
    }

    // Too short?
    if (s.length() < GM67_MIN_BARCODE_LEN) {
        return ValidationResult::TOO_SHORT;
    }

    // Too long?
    if (s.length() > GM67_MAX_BARCODE_LEN) {
        return ValidationResult::TOO_LONG;
    }

    // Character whitelist — every character must be printable ASCII (0x20–0x7E).
    // This rejects embedded nulls, DEL (0x7F), and any high-byte characters.
    for (uint16_t i = 0; i < s.length(); i++) {
        uint8_t c = (uint8_t)s[i];
        if (c < (uint8_t)VALID_BARCODE_CHARSET_START ||
            c > (uint8_t)VALID_BARCODE_CHARSET_END) {
            LOG_DEBUG(TAG, "Invalid char 0x%02X at pos %u", c, i);
            return ValidationResult::INVALID_CHARS;
        }
    }

    return ValidationResult::OK;
}

// =============================================================================
// Static utility: resultString
// =============================================================================

const char* BarcodeProcessor::resultString(ValidationResult r) {
    switch (r) {
        case ValidationResult::OK:            return "OK";
        case ValidationResult::TOO_SHORT:     return "TOO_SHORT";
        case ValidationResult::TOO_LONG:      return "TOO_LONG";
        case ValidationResult::INVALID_CHARS: return "INVALID_CHARS";
        case ValidationResult::DUPLICATE:     return "DUPLICATE";
        case ValidationResult::EMPTY:         return "EMPTY";
        default:                              return "UNKNOWN";
    }
}

// =============================================================================
// Accessors
// =============================================================================

const String& BarcodeProcessor::getLastBarcode() const {
    return _lastBarcode;
}

uint32_t BarcodeProcessor::getLastBarcodeTime() const {
    return _lastBarcodeTime;
}

void BarcodeProcessor::resetDebounce() {
    _lastBarcode     = "";
    _lastBarcodeTime = 0;
    LOG_DEBUG(TAG, "Debounce state reset");
}

// =============================================================================
// Private helpers
// =============================================================================

bool BarcodeProcessor::_isDuplicate(const String& s) const {
    if (_lastBarcode.isEmpty()) return false;

    bool sameContent = (_lastBarcode == s);
    bool withinWindow = ((millis() - _lastBarcodeTime) < BARCODE_DEBOUNCE_MS);

    return (sameContent && withinWindow);
}
