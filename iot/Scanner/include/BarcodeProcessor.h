/**
 * @file    BarcodeProcessor.h
 * @brief   Validates, sanitises, and routes completed barcode strings.
 *
 * DESIGN RATIONALE
 * ----------------
 * Raw bytes from a scanner must be cleaned before being sent anywhere.
 * This class is the "firewall" between raw scanner output and business logic.
 *
 * Responsibilities:
 *   1. Strip whitespace / control characters from both ends.
 *   2. Enforce min/max length constraints.
 *   3. Reject barcodes containing non-printable characters.
 *   4. Enforce debounce — ignore a repeated scan within BARCODE_DEBOUNCE_MS.
 *   5. Invoke a user-supplied callback with the clean barcode string.
 *
 * The callback pattern (dependency injection) keeps BarcodeProcessor decoupled
 * from whatever "consumes" the barcode (serial output, WiFi, MQTT, database).
 *
 * SOLID:
 *   - Single Responsibility: validation + debounce only.
 *   - Dependency Inversion: depends on a callback, not a concrete output class.
 *   - Open/Closed: add new validation rules without changing callers.
 */

#pragma once

#include <Arduino.h>
#include <functional>
#include "Config.h"

// =============================================================================
// Validation result codes
// =============================================================================

enum class ValidationResult : uint8_t {
    OK = 0,         ///< Barcode is clean and ready to use
    TOO_SHORT,      ///< Fewer than GM67_MIN_BARCODE_LEN characters
    TOO_LONG,       ///< Exceeds GM67_MAX_BARCODE_LEN characters
    INVALID_CHARS,  ///< Contains non-printable / non-ASCII characters
    DUPLICATE,      ///< Same barcode scanned within debounce window
    EMPTY           ///< Zero-length string after sanitisation
};

// =============================================================================
// BarcodeProcessor
// =============================================================================

class BarcodeProcessor {
public:
    // ---- Callback type ----
    // Called with the clean barcode string once all validations pass.
    // Using std::function allows lambdas, free functions, or bound methods.
    using BarcodeCallback = std::function<void(const String& barcode)>;

    // -------------------------------------------------------------------------
    // Constructor.
    // @param callback  Function called when a valid, non-duplicate barcode
    //                  is received.  Must not be nullptr.
    // -------------------------------------------------------------------------
    explicit BarcodeProcessor(BarcodeCallback callback);

    // -------------------------------------------------------------------------
    // Submit a raw barcode string for processing.
    // Internally calls sanitise() → validate() → debounce() → callback.
    // @param raw  Raw string as received from the UART buffer.
    // @return     The ValidationResult; OK means callback was invoked.
    // -------------------------------------------------------------------------
    ValidationResult process(const String& raw);

    // -------------------------------------------------------------------------
    // Sanitise a raw barcode string in-place.
    // Strips leading/trailing whitespace and control characters.
    // @param s  String to sanitise (modified in place).
    // -------------------------------------------------------------------------
    static void sanitise(String& s);

    // -------------------------------------------------------------------------
    // Validate a sanitised barcode string.
    // @param s  Already-sanitised string.
    // @return   ValidationResult (OK means the string is usable).
    // -------------------------------------------------------------------------
    static ValidationResult validate(const String& s);

    // -------------------------------------------------------------------------
    // Returns a human-readable description of a ValidationResult code.
    // -------------------------------------------------------------------------
    static const char* resultString(ValidationResult r);

    // -------------------------------------------------------------------------
    // Returns the last accepted barcode string (empty if none yet).
    // -------------------------------------------------------------------------
    const String& getLastBarcode() const;

    // -------------------------------------------------------------------------
    // Returns the millisecond timestamp of the last accepted barcode.
    // -------------------------------------------------------------------------
    uint32_t getLastBarcodeTime() const;

    // -------------------------------------------------------------------------
    // Resets the debounce state (useful after a UART recovery).
    // -------------------------------------------------------------------------
    void resetDebounce();

private:
    BarcodeCallback _callback;
    String          _lastBarcode;
    uint32_t        _lastBarcodeTime;   ///< millis() of last accepted scan

    // Returns true if the barcode is the same as _lastBarcode AND arrived
    // within BARCODE_DEBOUNCE_MS of _lastBarcodeTime.
    bool _isDuplicate(const String& s) const;
};
