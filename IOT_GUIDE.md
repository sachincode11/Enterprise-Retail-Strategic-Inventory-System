# ERSIS IoT Scanner Integration Guide

> **ESP32 + GM67 Barcode Scanner → WiFi → FastAPI → WebSocket → POS Cart**

This guide walks you through every step needed to get your physical ESP32 barcode scanner talking to the ERSIS Point-of-Sale system in real time.

---

## 📋 Table of Contents

1. [How It Works](#-how-it-works)
2. [Hardware Requirements](#-hardware-requirements)
3. [Wiring the GM67 to the ESP32](#-wiring-the-gm67-to-the-esp32)
4. [Software Prerequisites](#-software-prerequisites)
5. [Step 1 — Configure the Firmware](#step-1--configure-the-firmware)
6. [Step 2 — Build & Flash the Firmware](#step-2--build--flash-the-firmware)
7. [Step 3 — Start the Backend (LAN Mode)](#step-3--start-the-backend-lan-mode)
8. [Step 4 — Verify the Connection](#step-4--verify-the-connection)
9. [Step 5 — Test a Scan End-to-End](#step-5--test-a-scan-end-to-end)
10. [Monitoring Devices in the POS UI](#-monitoring-devices-in-the-pos-ui)
11. [Data Flow Reference](#-data-flow-reference)
12. [Configuration Reference](#-configuration-reference)
13. [Troubleshooting](#-troubleshooting)
14. [Security Notes](#-security-notes)

---

## ⚙️ How It Works

```
GM67 Scanner (scans barcode)
        │  UART (Serial2)
        ▼
ESP32 Microcontroller
        │  HTTP POST  /api/v1/iot/scan
        │  WiFi (LAN)
        ▼
FastAPI Backend  ──────────────────────────────────────►  MySQL Database
        │                                                  (product lookup)
        │  WebSocket broadcast  /api/v1/iot/ws/{store_id}
        ▼
React POS (browser)
        │
        ▼
Product auto-added to cashier's cart ✓
```

The **ESP32** acts as a WiFi bridge. Every time the GM67 scans a barcode:

1. The barcode string arrives over UART2 (hardware serial).
2. The firmware validates and debounces it (ignores duplicates within 3 s).
3. An HTTP POST is sent to the ERSIS backend on your LAN.
4. The backend looks up the product in MySQL, then **broadcasts it via WebSocket** to all open POS browser tabs for that store.
5. The cashier's cart updates instantly — zero typing required.

Additionally, the device sends a **heartbeat ping** every 30 seconds to `GET /api/v1/iot/health`, which keeps the "Online" status indicator green in the cashier settings panel.

---

## 🔧 Hardware Requirements

| Component | Specification | Notes |
|:---|:---|:---|
| **Microcontroller** | ESP32 (any variant with WiFi) | Tested on ESP32-WROOM-32 / ESP32-DevKitC |
| **Barcode Scanner** | GM67 1D/2D Module | Connected via UART (TTL 3.3 V) |
| **USB Cable** | Micro-USB or USB-C (depends on board) | For flashing and serial debug |
| **Power Supply** | 5 V via USB or external regulator | ESP32 needs stable 3.3 V core |
| **WiFi Network** | 2.4 GHz (ESP32 does not support 5 GHz) | Same network as the backend PC |

---

## 🔌 Wiring the GM67 to the ESP32

The GM67 communicates via **UART at 115200 baud, 8N1**.

| GM67 Pin | ESP32 GPIO | Description |
|:---|:---|:---|
| **TX** | **GPIO 26** (RX2) | GM67 transmits → ESP32 receives |
| **RX** | **GPIO 27** (TX2) | ESP32 transmits → GM67 receives |
| **GND** | **GND** | Common ground |
| **VCC** | **3.3 V** | Check your GM67 module's voltage spec |

> [!IMPORTANT]
> The GM67 terminates each barcode string with a **carriage return `\r`**. Some modules add `\r\n`. The firmware handles both automatically.

> [!WARNING]
> Do NOT connect the GM67 VCC to the ESP32's 5V pin if your GM67 module is rated for 3.3 V — this will damage the scanner.

**Wiring Diagram (ASCII):**

```
  GM67 Module                    ESP32 DevKit
  ┌──────────┐                  ┌──────────────┐
  │     TX   ├─────────────────►│  GPIO 26     │
  │     RX   │◄─────────────────┤  GPIO 27     │
  │    GND   ├─────────────────►│  GND         │
  │    VCC   ├─────────────────►│  3.3V        │
  └──────────┘                  └──────────────┘
                                      │
                                  USB to PC
                              (power + debug serial)
```

> [!TIP]
> Pin assignments can be changed in `iot/Scanner/include/Config.h` — look for `GM67_RX_PIN` and `GM67_TX_PIN`.

---

## 💻 Software Prerequisites

| Tool | Version | Install |
|:---|:---|:---|
| **VS Code** | Latest | [code.visualstudio.com](https://code.visualstudio.com/) |
| **PlatformIO IDE** | Extension | VS Code → Extensions → search "PlatformIO IDE" |
| **Python** | 3.13 | Required by PlatformIO toolchain |
| **USB-to-Serial driver** | CP2102 / CH340 | Install the driver for your ESP32's USB chip |

---

## Step 1 — Configure the Firmware

All settings live in one file: **`iot/Scanner/include/Config.h`**

### 1a. Find your machine's LAN IP

Your backend machine's IP must be reachable from the ESP32 (same WiFi network).

**Windows:**
```powershell
ipconfig | findstr "IPv4"
# Look for the 192.168.x.x address on your WiFi adapter
```

**macOS/Linux:**
```bash
ifconfig | grep "inet " | grep -v 127.0.0.1
```

### 1b. Edit Config.h

Open `iot/Scanner/include/Config.h` and update these values:

```cpp
// ── WiFi Credentials ──────────────────────────────────────────────────
#ifndef WIFI_SSID
  #define WIFI_SSID     "YourWiFiNetworkName"   // ← Your 2.4 GHz SSID
#endif

#ifndef WIFI_PASSWORD
  #define WIFI_PASSWORD "YourWiFiPassword"       // ← Your WiFi password
#endif

// ── Backend API Endpoint ──────────────────────────────────────────────
#ifndef API_BASE_URL
  #define API_BASE_URL  "http://192.168.1.77:8000"  // ← Your machine's LAN IP
#endif

#ifndef API_STORE_ID
  #define API_STORE_ID  "1"   // ← Your store ID (check your database)
#endif

// ── Shared Secret (must match backend .env IOT_DEVICE_SECRET) ─────────
#ifndef IOT_DEVICE_SECRET
  #define IOT_DEVICE_SECRET "ersis-iot-dev-secret"   // ← Change in production!
#endif
```

> [!IMPORTANT]
> The **`API_BASE_URL` IP address must match your backend machine's LAN IP exactly** (the `192.168.x.x` address, not `localhost` or `127.0.0.1`). The ESP32 is a separate device on the network — it cannot use loopback addresses.

> [!TIP]
> You can also override these without editing the file by adding build flags in `platformio.ini`:
> ```ini
> build_flags =
>     ${common.build_flags}
>     -DWIFI_SSID='"MyNetwork"'
>     -DWIFI_PASSWORD='"MyPassword"'
>     -DAPI_BASE_URL='"http://192.168.1.77:8000"'
> ```

### 1c. Verify the shared secret matches the backend

The `IOT_DEVICE_SECRET` in `Config.h` must **exactly match** `IOT_DEVICE_SECRET` in `backend/.env`:

```env
# backend/.env
IOT_DEVICE_SECRET=ersis-iot-dev-secret
```

---

## Step 2 — Build & Flash the Firmware

### Using VS Code + PlatformIO (Recommended)

1. Open VS Code.
2. Open the folder `iot/Scanner/` (not the root of the project).
3. PlatformIO will automatically detect `platformio.ini` and install the ESP32 toolchain (~300 MB, first time only).
4. Connect the ESP32 via USB.
5. Click the **→ Upload** button in the bottom status bar (or press `Ctrl+Alt+U`).
6. Wait for: `Linking .pio/build/esp32dev/firmware.elf` → `Writing at 0x00001000...` → `Hard resetting via RTS pin...`

### Using PlatformIO CLI

```bash
cd iot/Scanner
pio run --target upload
```

### Open Serial Monitor

After flashing, open the Serial Monitor to verify the device is working:

**VS Code:** Click the plug icon 🔌 in the bottom status bar.
**CLI:** `pio device monitor --baud 115200`

You should see output like:
```
╔══════════════════════════════════╗
║  ERSIS ESP32 GM67 Scanner  v1.0  ║
╚══════════════════════════════════╝
[MAIN] Boot sequence starting...
[WIFI] Connecting to SSID: YourWiFiNetworkName
......
[WIFI] Connected!  IP=192.168.1.105  RSSI=-62 dBm
[MAIN] WiFi ready. IP: 192.168.1.105
[MAIN] Setup complete — scanning active
```

> [!WARNING]
> If you see `[WIFI] Connection timeout after 15000 ms`, the WiFi credentials are wrong, or the network is 5 GHz (ESP32 only supports 2.4 GHz).

---

## Step 3 — Start the Backend (LAN Mode)

The backend **must** be bound to `0.0.0.0` (all interfaces) — not `localhost` — so the ESP32 can reach it.

1.  Open your terminal in the `backend` folder.
2.  Activate your virtual environment (`.venv\Scripts\activate`).
3.  Run the following command:

```bash
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

### Verify the backend is LAN-accessible

Run this from a terminal and confirm `0.0.0.0:8000` is in the output:
```powershell
netstat -an | findstr ":8000"
# Must show:  TCP  0.0.0.0:8000  LISTENING
```

### Windows Firewall

Allow inbound connections on port 8000 (run as Administrator):
```powershell
netsh advfirewall firewall add rule name="ERSIS Backend Port 8000" dir=in action=allow protocol=TCP localport=8000
```

> [!NOTE]
> This firewall rule was already added during previous setup. You can verify it with:
> `netsh advfirewall firewall show rule name="ERSIS Backend Port 8000"`

---

## Step 4 — Verify the Connection

### 4a. Check the Serial Monitor

After the backend is running, the ESP32 sends a heartbeat every 30 seconds. You should see:

```
[MAIN] Heartbeat | state=READY | scans=0
[HTTP] GET http://192.168.1.77:8000/api/v1/iot/health?device_id=ERSIS-SCANNER-01&store_id=1&...
[HTTP] Heartbeat sent (RSSI=-62)
```

### 4b. Check the POS Settings Page

1. Open the cashier POS in your browser: **http://localhost:5173**
2. Log in as a cashier.
3. Navigate to **Settings → IoT Devices** (or go directly to `/#/cashier/s3`).
4. Within 30–45 seconds of the ESP32 booting, you should see the device appear with an **🟢 Online** status badge.

### 4c. Check the API directly

```bash
curl http://localhost:8000/api/v1/iot/health
```

Expected response when a device is connected:
```json
{
  "ws_connections": { "1": 1 },
  "registered_devices": [
    {
      "device_id": "ERSIS-SCANNER-01",
      "store_id": "1",
      "ip_address": "192.168.1.105",
      "rssi": -62,
      "scans": 0,
      "uptime_s": 45,
      "firmware": "1.0.0",
      "last_seen": "2026-05-12T00:15:30+00:00",
      "status": "Online"
    }
  ]
}
```

---

## Step 5 — Test a Scan End-to-End

1. Open **http://localhost:5173** → Log in as cashier → Go to **POS**.
2. Confirm the top-right status badge shows **Scanner: Online** (green dot).
3. Point the GM67 at any product barcode in your inventory.
4. The GM67 will emit a short beep and flash its laser.
5. In the Serial Monitor you will see:
   ```
   BARCODE:5901234123457
   [APP] >>> BARCODE: 5901234123457
   [HTTP] POST http://192.168.1.77:8000/api/v1/iot/scan  body={...}
   [APP] Product: Coca-Cola 500ml  Price: 85.00  Stock: 42
   ```
6. In the browser, the product **automatically appears in the cart** — no typing required.

> [!NOTE]
> If the barcode exists in the database (`POST /api/v1/iot/scan` returns 200), the cart updates. If not, the backend returns 404 and the Serial Monitor shows `Barcode not in catalogue`.

---

## 📊 Monitoring Devices in the POS UI

Navigate to **Settings → IoT Devices** (`/#/cashier/s3`) for a live dashboard:

| UI Element | Description |
|:---|:---|
| **Stats bar** | Total registered devices / Online count / Active POS WS clients |
| **🟢 Online badge** | Device pinged within the last 45 seconds |
| **⚫ Offline badge** | No heartbeat received for > 45 seconds |
| **Signal bars** | RSSI converted to 4-bar visual (Excellent / Good / Fair / Weak) |
| **Last seen** | Human-readable age: "3s ago", "2m ago" |
| **Details modal** | Click a device row → see firmware version, IP, uptime, total scans |
| **Auto-refresh** | Page polls every 10 seconds automatically |
| **Refresh Now** | Manual refresh button |

---

## 🔁 Data Flow Reference

```
ESP32                          Backend (FastAPI)              Browser (POS)
  │                                    │                           │
  │── POST /api/v1/iot/scan ──────────►│                           │
  │   Headers:                         │  1. Look up barcode       │
  │     X-IoT-Secret: <secret>         │     in MySQL              │
  │     X-Device-Id: ERSIS-SCANNER-01  │  2. Build product payload │
  │   Body:                            │  3. Broadcast via WS ─────►│
  │     { barcode, device_id,          │                           │
  │       store_id }                   │                           │  addToCart()
  │                                    │                           │  ← product appears
  │◄── 200 OK ─────────────────────────│                           │
  │    { product_name, unit_price,     │                           │
  │      stock, ... }                  │                           │
  │                                    │                           │
  │── GET /api/v1/iot/health ─────────►│  Update device registry   │
  │   (every 30 s)                     │  (last_seen, RSSI, etc.)  │
  │◄── 200 OK ─────────────────────────│                           │
```

---

## 📁 Configuration Reference

### `iot/Scanner/include/Config.h`

| Constant | Default | Description |
|:---|:---|:---|
| `FW_DEVICE_ID` | `"ERSIS-SCANNER-01"` | Unique device identifier shown in the UI |
| `FW_VERSION` | `"1.0.0"` | Firmware version string |
| `GM67_RX_PIN` | `26` | ESP32 GPIO receiving GM67 TX |
| `GM67_TX_PIN` | `27` | ESP32 GPIO driving GM67 RX |
| `GM67_BAUD_RATE` | `115200` | Scanner UART baud rate |
| `BARCODE_DEBOUNCE_MS` | `3000` | Min ms between identical scans |
| `WIFI_SSID` | `"ayurvedaoushadhalaya_2.4"` | **Change to your network** |
| `WIFI_PASSWORD` | `"CLEB2D7787"` | **Change to your password** |
| `WIFI_CONNECT_TIMEOUT_MS` | `15000` | WiFi connection timeout |
| `API_BASE_URL` | `"http://192.168.1.77:8000"` | **Must match your machine's LAN IP** |
| `API_STORE_ID` | `"1"` | Store ID in ERSIS database |
| `IOT_DEVICE_SECRET` | `"ersis-iot-dev-secret"` | Shared secret (match with backend .env) |
| `HTTP_TIMEOUT_MS` | `5000` | HTTP request timeout |
| `LOOP_YIELD_MS` | `10` | FreeRTOS yield delay (feeds watchdog) |
| `STATUS_INTERVAL_MS` | `30000` | Heartbeat send interval (in `main.cpp`) |

### `backend/.env`

| Key | Default | Description |
|:---|:---|:---|
| `IOT_DEVICE_SECRET` | `ersis-iot-dev-secret` | Must match firmware `IOT_DEVICE_SECRET` |

### Backend API Endpoints

| Method | Endpoint | Auth | Called by |
|:---|:---|:---|:---|
| `POST` | `/api/v1/iot/scan` | `X-IoT-Secret` header | ESP32 on each scan |
| `GET` | `/api/v1/iot/health` | None (public) | ESP32 heartbeat + POS settings page |
| `WS` | `/api/v1/iot/ws/{store_id}` | None | POS browser (receives scan events) |

---

## 🔧 Troubleshooting

### ESP32 won't connect to WiFi

| Symptom | Likely Cause | Fix |
|:---|:---|:---|
| Dots print forever: `......` | Wrong SSID or password | Double-check `WIFI_SSID` and `WIFI_PASSWORD` in Config.h |
| `Connection timeout after 15000 ms` | 5 GHz network | ESP32 only supports **2.4 GHz** — switch networks |
| Connects then immediately drops | Weak signal | Move ESP32 closer to router |
| `WL_NO_SSID_AVAIL` in serial | Network not visible | Verify SSID is broadcasting; disable AP isolation |

### HTTP POST fails (scan not reaching backend)

| Symptom | Serial Log | Fix |
|:---|:---|:---|
| `HTTP error: connection refused (-1)` | `[HTTP] HTTP error: -1` | Backend not running, or wrong IP in `API_BASE_URL`. |
| `ECONNREFUSED` (in Vite) | `[vite] http proxy error` | Your backend server is stopped. Start it with `--host 0.0.0.0`. |
| `HTTP error: timeout` | `[HTTP] HTTP error: TIMEOUT` | Firewall blocking port 8000; or backend bound to `127.0.0.1`. |
| `403 Forbidden` | HTTP response code 403 | `IOT_DEVICE_SECRET` mismatch between firmware and `backend/.env` |
| `404 Not Found` | HTTP response code 404 | Barcode doesn't exist in your product catalogue |

### POS status badge stuck on "No Device"

| Cause | Fix |
|:---|:---|
| ESP32 not yet booted | Wait ~15 s for WiFi + first heartbeat |
| Heartbeat not reaching backend | Verify `API_BASE_URL` IP, backend running with `--host 0.0.0.0` |
| Backend restarted (in-memory registry cleared) | Registry is in-memory; wait 30 s for next heartbeat after restart |

### Product not added to cart

| Symptom | Fix |
|:---|:---|
| Serial shows `OK` but cart empty | Browser is not connected to WS endpoint — refresh the POS page |
| Serial shows `404 Not Found` | Barcode doesn't match any product in the database for `store_id=1` |
| Serial shows `403 Forbidden` | Shared secret mismatch — re-check `IOT_DEVICE_SECRET` on both sides |

### "Scanner: Offline" in POS badge header

This badge reflects the **physical ESP32 device**, not just the WebSocket connection. It is based on the 45-second heartbeat threshold. If the device is on and connected, the badge turns green within 30–45 seconds automatically.

---

## 🔒 Security Notes

> [!CAUTION]
> The default `IOT_DEVICE_SECRET` value (`ersis-iot-dev-secret`) is public and **must be changed for any non-development deployment**.

**To change the shared secret:**

1. Generate a strong random value:
   ```bash
   python -c "import secrets; print(secrets.token_hex(32))"
   ```
2. Update `backend/.env`:
   ```env
   IOT_DEVICE_SECRET=your-new-random-64-char-secret
   ```
3. Update `iot/Scanner/include/Config.h`:
   ```cpp
   #define IOT_DEVICE_SECRET "your-new-random-64-char-secret"
   ```
4. Re-flash the ESP32.
5. Restart the backend.

**Additional security for production:**
- Use HTTPS (`https://`) for `API_BASE_URL` — requires an SSL certificate on the backend.
- Restrict the `/api/v1/iot/scan` endpoint to known device IP addresses via a reverse proxy rule.
- Enable OTA (Over-The-Air) updates (`#define FEATURE_OTA_ENABLED` in Config.h) to push firmware updates without physical access.
- Use PlatformIO build flags for secrets so they never appear in source code:
  ```ini
  ; platformio.ini  (local override, git-ignored)
  build_flags =
      ${common.build_flags}
      -DIOT_DEVICE_SECRET='"your-strong-secret"'
      -DWIFI_PASSWORD='"your-password"'
  ```

---

*For architecture details, see [`iot/Scanner/src/main.cpp`](./iot/Scanner/src/main.cpp) and the source files in `iot/Scanner/src/`.*
