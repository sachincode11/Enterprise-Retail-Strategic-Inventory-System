# ESP32 GM67 Barcode Scanner — Firmware Architecture Reference

> **Project:** ERSIS IoT Scanner Node  
> **Board:** ESP32 Dev Module · **Scanner:** GM67 · **IDE:** PlatformIO  
> **Firmware Version:** 1.0.0

---

## 1. Final Folder Structure

```
iot/Scanner/
├── platformio.ini              ← Build system config (dev + prod envs)
│
├── include/                    ← Public headers (one per module)
│   ├── Config.h                ← ALL compile-time constants
│   ├── Logger.h                ← Logging macros + class declaration
│   ├── DeviceStatus.h          ← State machine header
│   ├── BarcodeProcessor.h      ← Validation pipeline header
│   └── GM67Scanner.h           ← UART driver header
│
├── src/                        ← Implementations
│   ├── main.cpp                ← Entry point — wiring only, no business logic
│   ├── Logger.cpp
│   ├── DeviceStatus.cpp
│   ├── BarcodeProcessor.cpp
│   └── GM67Scanner.cpp
│
├── lib/                        ← Future: local libraries (WiFi, MQTT wrappers)
├── test/                       ← Future: unit tests (PlatformIO Unity)
└── shared/                     ← Shared protocol definitions (sibling dir)
```

---

## 2. Module Explanations

### `Config.h` — Central Configuration

**Role:** Single source of truth for every magic number in the firmware.

| Constant | Value | Purpose |
|---|---|---|
| `GM67_RX_PIN` | 26 | ESP32 GPIO receiving scanner TX |
| `GM67_TX_PIN` | 27 | ESP32 GPIO driving scanner RX |
| `GM67_BAUD_RATE` | 115200 | UART communication speed |
| `GM67_MAX_BARCODE_LEN` | 128 | Buffer ceiling |
| `GM67_MIN_BARCODE_LEN` | 4 | Rejects garbage/partial reads |
| `BARCODE_DEBOUNCE_MS` | 1500 | Prevents double-scan events |
| `GM67_TIMEOUT_MS` | 5000 | UART silence → trigger recovery |
| `LOOP_YIELD_MS` | 10 | FreeRTOS scheduler yield interval |
| `LOG_LEVEL` | 3 (dev) / 1 (prod) | Compile-time log verbosity |

**Why `constexpr` not `#define`?** `constexpr` values are typed and scope-aware — the compiler can catch type mismatches. `#define` macros are textual substitution with no type safety.

---

### `Logger` — Zero-Cost Levelled Logging

**Role:** Format and write timestamped, tag-namespaced log lines to Serial.

**Output format:**
```
[00012345] [I][GM67] Scanner initialised on UART2
[00013001] [W][BCODE] Rejected [AB]: TOO_SHORT
[00013500] [I][APP] >>> BARCODE: 5901234123457
```

**Key design — macro wrappers:**
```cpp
// In debug build (LOG_LEVEL=4):
LOG_DEBUG("GM67", "Raw: %s", buf);   // → compiled in, full output

// In production build (LOG_LEVEL=1):
LOG_DEBUG("GM67", "Raw: %s", buf);   // → compiled OUT completely (zero bytes)
```
This means production firmware is faster AND smaller without changing any source files — just set `LOG_LEVEL=1` in `platformio.ini`.

---

### `DeviceStatus` — Health State Machine

**Role:** Track the device's operational health through a strict state machine.

```
INITIALISING
     │ setup() succeeds
     ▼
   READY ◄──────────────────── RECOVERING
     │                              ▲
     │ first byte arrives           │ begin()/end() cycle complete
     ▼                              │
  SCANNING                    UART_ERROR
     │                              ▲
     │ barcode dispatched           │ silence > GM67_TIMEOUT_MS
     ▼                              │
   READY ──────────────────────────┘
     │
     │ unrecoverable
     ▼
   FAULT  (requires hardware reset)
```

Every state change is logged with the time spent in the previous state — invaluable for diagnosing intermittent scanner faults in the field.

---

### `BarcodeProcessor` — Validation Pipeline

**Role:** Be the firewall between raw scanner bytes and the application.

**Pipeline stages for every received string:**

```
Raw string from UART
        │
        ▼
  sanitise()          Strip leading/trailing control chars & whitespace
        │
        ▼
  validate()          Length check · Charset whitelist (0x20–0x7E)
        │
        ▼
 _isDuplicate()       Compare with last barcode + BARCODE_DEBOUNCE_MS timer
        │
        ▼
  _callback()         onBarcodeReady() in main.cpp → Serial / WiFi / MQTT
```

**Why a callback instead of a direct Serial.println?**  
Dependency Inversion Principle — `BarcodeProcessor` doesn't know or care how barcodes are consumed. Swap `Serial.println` for `mqttClient.publish()` by changing **one line in `main.cpp`**, not inside the library.

---

### `GM67Scanner` — Non-Blocking UART Driver

**Role:** Drain the UART FIFO every loop tick, assemble bytes into lines, and run the health watchdog.

**Why a static `char[]` buffer instead of `String`?**

| | `String` (heap) | `char[]` (static) |
|---|---|---|
| Allocation | Runtime heap | Compile time |
| Fragmentation risk | Yes | None |
| Predictable size | No | Yes |
| Crash risk on MCU | Possible | Not from this |

ESP32 has only 320 KB of DRAM. `String` objects that grow/shrink repeatedly fragment the heap. After days of continuous operation this causes random crashes — the most notorious bug class in Arduino firmware.

**UART Watchdog flow:**
```
Every UART_WATCHDOG_INTERVAL_MS (2 s):
  ├── If silence < GM67_TIMEOUT_MS  →  log "OK", continue
  └── If silence ≥ GM67_TIMEOUT_MS  →  serial.end() + set RECOVERING
                                        wait UART_RECOVERY_DELAY_MS (3 s)
                                        serial.begin() + set READY
```

---

### `main.cpp` — Thin Orchestrator

**Role:** Instantiate modules, wire them together, and run the event loop. Zero business logic.

**Object wiring order matters:**
```cpp
DeviceStatus deviceStatus;          // 1st — no dependencies
BarcodeProcessor barcodeProcessor(  // 2nd — depends on callback lambda
    [](const String& b) { ... }
);
GM67Scanner scanner(                // 3rd — depends on both above
    barcodeProcessor, deviceStatus
);
```
All objects are **global static** — never heap-allocated, never destroyed. This is standard practice for MCU firmware.

---

## 3. Data Flow Diagram

```
┌─────────────┐  UART bytes   ┌──────────────────┐
│  GM67 HW    │ ─────────────►│  HW FIFO buffer  │
│  Scanner    │               │  (ESP32 UART2)   │
└─────────────┘               └────────┬─────────┘
                                       │ _drainFifo() called every ~10ms
                              ┌────────▼─────────┐
                              │  GM67Scanner     │
                              │  _lineBuffer[]   │ ← static char[129]
                              │  _handleByte()   │
                              └────────┬─────────┘
                                       │ on CR terminator
                              ┌────────▼─────────┐
                              │ BarcodeProcessor │
                              │  sanitise()      │
                              │  validate()      │
                              │  _isDuplicate()  │
                              └────────┬─────────┘
                                       │ ValidationResult::OK
                              ┌────────▼─────────┐
                              │ onBarcodeReady() │  ← in main.cpp
                              │  Serial.println  │
                              │  [MQTT hook]     │
                              │  [REST hook]     │
                              └──────────────────┘
```

---

## 4. Inter-Module Communication

| From | To | Mechanism | Direction |
|---|---|---|---|
| `main.cpp` | `GM67Scanner` | Direct method call (`update()`) | → |
| `GM67Scanner` | `BarcodeProcessor` | Reference, method call (`process()`) | → |
| `BarcodeProcessor` | `main.cpp` | `std::function` callback | → |
| `GM67Scanner` | `DeviceStatus` | Reference, method calls (`setReady()` etc.) | → |
| Any module | `Logger` | Static method calls via `LOG_*` macros | → |
| Any module | `Config.h` | `#include` (compile-time constants) | read-only |

**No global variables are shared** between modules except the objects defined in `main.cpp` and passed by reference. This enforces encapsulation.

---

## 5. Serial Output Protocol

The firmware outputs structured lines parseable by any host application:

```
BARCODE:5901234123457          ← Valid scan (use this in your backend)
[00012345] [I][APP] >>> BARCODE: 5901234123457   ← Info log
[00013000] [W][BCODE] Rejected [AB]: TOO_SHORT   ← Warning log
[00030000] [I][MAIN] Heartbeat | state=READY | scans=12 | ...
```

**Parse barcodes in Python/Node.js:**
```python
# Python example for reading from ESP32 over USB
import serial
ser = serial.Serial('COM3', 115200)
for line in ser:
    line = line.decode().strip()
    if line.startswith("BARCODE:"):
        barcode = line[8:]
        print(f"Scanned: {barcode}")
```

---

## 6. SOLID Principles Applied

| Principle | Application |
|---|---|
| **S**ingle Responsibility | Each class does exactly one thing: `Logger` logs, `BarcodeProcessor` validates, `GM67Scanner` drives UART, `DeviceStatus` tracks health |
| **O**pen/Closed | Add new validation rules to `BarcodeProcessor` without modifying `GM67Scanner`. Add MQTT without modifying `BarcodeProcessor` — extend `main.cpp`'s callback |
| **L**iskov Substitution | N/A at current scale — applied through well-defined interfaces |
| **I**nterface Segregation | Modules depend on references/callbacks, not concrete implementations |
| **D**ependency Inversion | `BarcodeProcessor` depends on a `std::function` abstraction. `GM67Scanner` depends on a `BarcodeProcessor` reference, not `Serial` directly |

---

## 7. Build Environments

```ini
[env:esp32dev]   ; Development
  LOG_LEVEL=4    ; Full debug output
  DEBUG_MODE=1

[env:esp32prod]  ; Production
  LOG_LEVEL=1    ; Errors only — faster, smaller binary
  DEBUG_MODE=0
  -Os            ; Size optimisation
```

**Build commands:**
```bash
# Development build + upload
pio run -e esp32dev -t upload

# Production build
pio run -e esp32prod

# Monitor serial output
pio device monitor

# Clean all
pio run -t clean
```

---

## 8. Future Scalability Roadmap

### 8.1 WiFi + MQTT (Phase 2)

```cpp
// include/MqttClient.h  — new module
class MqttClient {
public:
    bool begin(const char* broker, uint16_t port);
    void update();  // called from loop()
    bool publish(const char* topic, const String& payload);
};

// In main.cpp — swap callback body:
[](const String& barcode) {
    mqttClient.publish("ersis/scanner/scan", barcode);
}
```

No changes to `GM67Scanner` or `BarcodeProcessor`. The callback is the extension point.

### 8.2 REST API

```cpp
// In onBarcodeReady():
HTTPClient http;
http.begin("http://192.168.1.100:5000/api/scan");
http.addHeader("Content-Type", "application/json");
http.POST("{\"barcode\":\"" + barcode + "\",\"device\":\"" + FW_DEVICE_ID + "\"}");
```

### 8.3 OTA Firmware Updates

```cpp
// In setup():
ArduinoOTA.setHostname(FW_DEVICE_ID);
ArduinoOTA.begin();

// In loop():
ArduinoOTA.handle();  // Non-blocking — only active during OTA push
```

### 8.4 FreeRTOS Tasks (Phase 3)

Split the single `loop()` into pinned tasks:

```cpp
// Core 0 — Scanner UART (time-critical)
xTaskCreatePinnedToCore(
    [](void*) { while(true) { scanner.update(); vTaskDelay(1); } },
    "ScannerTask", 4096, nullptr, 2, nullptr, 0
);

// Core 1 — WiFi + MQTT (network I/O)
xTaskCreatePinnedToCore(
    [](void*) { while(true) { mqttClient.update(); vTaskDelay(10); } },
    "NetworkTask", 8192, nullptr, 1, nullptr, 1
);
```

Use a `QueueHandle_t` to pass barcodes from Core 0 → Core 1 safely.

### 8.5 ERSIS Database Integration

```
ESP32 ──UART──► USB Serial ──► Python Bridge Script ──► PostgreSQL
ESP32 ──WiFi──► HTTP POST  ──► Flask/FastAPI Backend ──► PostgreSQL
ESP32 ──WiFi──► MQTT       ──► Node.js Subscriber    ──► PostgreSQL
```

The recommended path for ERSIS is **WiFi + HTTP POST** since the backend already runs Flask — no new infrastructure needed.

---

## 9. Memory Footprint Estimate

| Region | Usage |
|---|---|
| `_lineBuffer` | 129 bytes (stack/BSS) |
| `_logBuf` | 256 bytes (BSS) |
| Total static RAM overhead | ~500 bytes |
| Typical firmware binary (dev) | ~250 KB flash |
| Typical firmware binary (prod) | ~200 KB flash |

ESP32 has **4 MB flash** and **320 KB DRAM** — this firmware uses < 1% of either.

---

## 10. Best Practices Summary

| Practice | Implementation |
|---|---|
| No `delay()` in hot path | Only in `begin()` / `_doRecover()` stabilisation pauses |
| No heap allocation in loop | Static buffers, no `new`/`delete` |
| No blocking UART reads | `available()` guard + return immediately |
| Typed enums | `DeviceState`, `ValidationResult` — no magic integers |
| `constexpr` constants | Zero runtime cost, type-safe |
| Production log stripping | `LOG_LEVEL` compile-time gate |
| Watchdog + auto-recovery | UART silence detection + re-init |
| Debounce | `BARCODE_DEBOUNCE_MS` window in `BarcodeProcessor` |
| Clean shutdown path | `scanner.end()` available for graceful teardown |
| Future-proof callback | `std::function` allows MQTT/REST with zero refactoring |
