# ERSIS – Setup & Installation Guide

> **Enterprise Retail & Strategic Inventory System**

There are two ways to run the **web stack** of this project. The **mobile app** always runs separately via Expo regardless of which method you choose.

| Method | Best for | Prerequisites |
| :--- | :--- | :--- |
| **[Docker](#-method-1-docker-recommended)** | Everyone – zero local installs needed | Docker Desktop |
| **[Manual](#-method-2-manual-local-setup)** | When Docker is unavailable | Python 3.13, Node 20, MySQL 8, uv |
| **[Mobile App](#-mobile-app-react-native--expo)** | Always run separately via Expo | Node 20, Expo CLI or Expo Go |

---

## Method 1: Docker (Recommended)

Docker spins up the **web stack** — MySQL, MQTT broker, FastAPI backend, and the React/Vite web frontend — with a single command. Nothing needs to be installed on your machine except Docker Desktop.

> **Note:** The **mobile app** (`frontend-mobile/`) is **not included in Docker**. It is a React Native / Expo project that must be run separately with Expo CLI. See the [Mobile App section](#-mobile-app-react-native--expo) below.

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) installed and running.

### Step 1 – Clone the repository
```bash
git clone https://github.com/sachincode11/Enterprise-Retail-Strategic-Inventory-System.git
cd Enterprise-Retail-Strategic-Inventory-System
```

### Step 2 – Create environment files

**Root `.env`** (controls Docker Compose variable substitution):
```bash
cp .env.docker.example .env
```
Open `.env` and fill in your secrets:
```env
# ── MySQL ──────────────────────────────────────────
MYSQL_ROOT_PASSWORD=YourStrongPassword!
MYSQL_DATABASE=ersis

# ── JWT (use a long random string in production) ───
JWT_SECRET_KEY=change-me-to-a-very-long-random-secret

# ── Groq AI API Key ────────────────────────────────
GROQ_API_KEY=gsk_...your_key_here...

# ── SMTP (for OTP emails) ──────────────────────────
SMTP_USER=your-email@gmail.com
SMTP_PASSWORD=your-gmail-app-password
EMAIL_FROM=your-email@gmail.com
```

> **Tip:** `MYSQL_DATABASE` defaults to `ersis` if omitted, but it is best practice to set it explicitly so it matches any external tools (Workbench, DBeaver) you connect with.

**Backend `.env`** (read by FastAPI inside the container):
```bash
cp backend/.env.example backend/.env
```
Open `backend/.env` and set the same `GROQ_API_KEY`, `SMTP_*`, and a strong `JWT_SECRET_KEY`.

> The `DATABASE_URL` in `backend/.env` still says `localhost` — that is fine.
> Docker Compose **overrides** it automatically to point to the MySQL container.

### Step 3 – Build and start all services
```bash
docker compose up -d --build
```
Docker will pull images, compile the frontend, install Python packages, and start everything. This takes ~3–5 minutes on the first run.

### Step 4 – Seed the database (first run only)
Once all containers are healthy, run the master seeder:
```bash
docker compose exec backend python seed.py
```
This populates MySQL with:
- Admin, Cashier, and 10 Customer accounts
- Products, Categories, and Suppliers
- 60 days of historical transactions
- Knowledge Base (FAQs & Policies)
- AI forecasts and chatbot data

### Step 5 – Open the app
| Service | URL | Notes |
| :--- | :--- | :--- |
| **Web App** | http://localhost | React/Vite admin & cashier UI |
| **API Docs (Swagger)** | http://localhost:8000/docs | FastAPI backend |
| **MySQL** (GUI tools) | `localhost:3306` | Use Workbench/DBeaver |
| **MQTT Broker** | `localhost:1883` | IoT barcode scanners |
| **Mobile App** | — | Run separately via Expo (see below) |

---

### Development Mode (hot-reload)

For active development, use the dev override — it enables **Uvicorn `--reload`** for the backend and the **Vite HMR dev server** for the frontend:

```bash
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build
```

| Service | URL | Auto-reload on save? |
| :--- | :--- | :--- |
| Frontend (Vite) | http://localhost:5173 | Yes |
| Backend (uvicorn) | http://localhost:8000 | Yes |
| API Docs | http://localhost:8000/docs | — |

### Useful Docker commands

```bash
# View live logs
docker compose logs -f backend
docker compose logs -f frontend

# Stop containers (keeps database data)
docker compose down

# Stop AND wipe ALL data (fresh start)
#  WARNING: this removes BOTH the MySQL volume (mysql-data) AND the
#    FAISS vector index volume (faiss-indexes).  After running this you
#    must re-seed the database to restore the chatbot / RAG knowledge base:
#      docker compose exec backend python seed.py
docker compose down -v

# Rebuild only the backend (e.g. after adding a Python package)
docker compose up -d --build backend

# Open a shell inside the backend container
docker compose exec backend bash
```

---

## Mobile App (React Native / Expo)

The mobile customer-facing app lives in `frontend-mobile/myApp/` and is built with **React Native + Expo**. It **cannot be Dockerized** — Expo requires a native runtime (Android emulator, iOS simulator, or a physical device via **Expo Go**).

The mobile app communicates with the backend API, so the backend must already be running (either via Docker or manually) before you start the app.

### Prerequisites
- Node.js **20 LTS**
- Expo Go app installed on your phone **or** an Android/iOS emulator

### Run the mobile app
```bash
cd frontend-mobile/myApp
npm install
npx expo start
```
This opens the **Expo Dev Tools** in your browser and displays a QR code.

| Target | How to open |
| :--- | :--- |
| **Physical device** | Scan the QR code with the Expo Go app (iOS / Android) |
| **Android emulator** | Press `a` in the Expo terminal |
| **iOS simulator** | Press `i` in the Expo terminal (macOS only) |
| **Web browser** | Press `w` in the Expo terminal |

### Connecting to the backend

The mobile app automatically detects your computer's IP address when running via **Expo Go**.

- **Automatic Detection:** Check your terminal logs for: `[Config] Detected Backend URL: http://192.168.x.x:8000/api/v1`
- **Manual Override:** If auto-detection fails, update `frontend-mobile/myApp/src/constants/config.js`.

> [!IMPORTANT]
> **Physical Device Requirements:**
> 1. Your phone and computer must be on the **same Wi-Fi network**.
> 2. You must allow **Port 8000** in your computer's firewall.
> 3. If running manually (not Docker), you must use the `--host 0.0.0.0` flag (see below).

---

## Default Login Credentials

After running `seed.py`, use these accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin_seed@store.np` | `Password@123` |
| **Cashier** | `cashier_seed1@store.np` | `Password@123` |
| **Customer** | `customer_seed1@store.np` | `Password@123` |

---

## Method 2: Manual (Local Setup)

Use this method only if Docker Desktop is not available on your machine.

### Prerequisites
- Python **3.13** (install via [python.org](https://www.python.org/))
- Node.js **20 LTS** (install via [nodejs.org](https://nodejs.org/))
- **MySQL 8.0** running locally
- `uv` Python package manager: `pip install uv`

### Step 1 – Clone & enter the project
```bash
git clone https://github.com/sachincode11/Enterprise-Retail-Strategic-Inventory-System.git
cd Enterprise-Retail-Strategic-Inventory-System
```

### Step 2 – MySQL database setup
1. Open MySQL Workbench (or a terminal MySQL client).
2. Create the database:
   ```sql
   CREATE DATABASE ersis;
   ```

### Step 3 – Backend setup
```bash
cd backend

# Copy and configure environment
# For window cmd
copy .env.example .env
# For Linux
cp .env.example .env
# Edit .env: set DATABASE_URL, GROQ_API_KEY, SMTP_*, JWT_SECRET_KEY
```
Open `backend/.env` and set:
```env
DATABASE_URL=mysql+pymysql://root:YOUR_MYSQL_PASSWORD@localhost/ersis
GROQ_API_KEY=gsk_...
JWT_SECRET_KEY=some-long-random-secret
SMTP_USER=your@email.com
SMTP_PASSWORD=your-app-password
EMAIL_FROM=your@email.com
```

Install dependencies and start the server:
```bash
uv venv
uv sync
# Windows:
.venv\Scripts\activate
# macOS/Linux:
source .venv/bin/activate

# Seed the database
python seed.py

# Start the API server
# --host 0.0.0.0 is REQUIRED to connect from a real mobile phone
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API is live at **http://127.0.0.1:8000** · Docs at **http://127.0.0.1:8000/docs**

### Step 4 – Frontend web setup
Open a **new terminal** (keep the backend running):
```bash
cd frontend-web
cp .env.example .env    # defaults are fine for local dev
npm install
npm run dev
```
Open **http://localhost:5173** in your browser.

### Step 5 – IoT Barcode Scanner (optional)

The ESP32 GM67 barcode scanner connects over **WiFi + HTTP** — no MQTT broker is required for the scanner integration.

**Quick setup:**

1. Edit `iot/Scanner/include/Config.h`:
   ```cpp
   #define WIFI_SSID     "YourWiFiSSID"
   #define WIFI_PASSWORD "YourWiFiPassword"
   #define API_BASE_URL  "http://192.168.x.x:8000"   // your machine's LAN IP
   ```

2. Flash the firmware via PlatformIO in VS Code (`iot/Scanner/` folder → Upload).

3. Start the backend with LAN access enabled (replace `localhost` with `0.0.0.0`):
   ```bash
   cd backend
   python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
   ```

4. Open the cashier settings at `/#/cashier/s3` — the device will appear with a green **Online** badge within 30 s.

### Step 6 – Mobile app
With the backend running, follow the **[Mobile App section](#-mobile-app-react-native--expo)** above to start the Expo dev server.

---

## Troubleshooting

### Docker / Web

| Symptom | Fix |
| :--- | :--- |
| Docker `backend` exits immediately | Run `docker compose logs backend` — usually a missing env var in `backend/.env` |
| MySQL health check keeps retrying | Wait 60s on first boot; MySQL initialises its data directory |
| Blank page after Docker start | Rebuild: `docker compose up -d --build frontend` |
| Hot-reload not working on Windows | Enable file sharing for the project drive in Docker Desktop → Settings → Resources → File Sharing |
| `uv sync` fails | Run `uv lock` locally to refresh `uv.lock`, commit it, then rebuild |
| Port 80 already in use | Change `"80:80"` → `"8080:80"` in `docker-compose.yml` and open http://localhost:8080 |
| FAISS index not found | Run `docker compose exec backend python seed.py` (or `python seed_ai.py` locally) |

### Mobile App

| Symptom | Fix |
| :--- | :--- |
| QR code scan fails / can't connect | Ensure your phone and computer are on the **same Wi-Fi network** |
| `Network request failed` on device | Replace `localhost` with your machine's LAN IP (e.g. `192.168.x.x:8000`) in the app config |
| `expo: command not found` | Run `npx expo start` instead, or install globally: `npm install -g expo-cli` |
| Expo Go shows "Something went wrong" | Check backend is running; verify API URL in app config matches backend address |
| Metro bundler port conflict | Add `--port 8082` to the `npx expo start` command |

### IoT Scanner

| Symptom | Fix |
| :--- | :--- |
| ESP32 won't connect to WiFi | Verify `WIFI_SSID` / `WIFI_PASSWORD` in `Config.h`. ESP32 only supports **2.4 GHz** networks. |
| HTTP error: connection refused | Backend is not running, or `API_BASE_URL` IP is wrong. Must match your machine's LAN IP. |
| HTTP error: timeout | Firewall is blocking port 8000. Run `start-backend.bat` which binds to `0.0.0.0`. |
| 403 Forbidden response | `IOT_DEVICE_SECRET` in `Config.h` doesn't match `backend/.env`. |
| 404 Not Found on scan | Barcode is not in the database for that `store_id`. Add the product first. |
| POS badge shows "No Device" | Wait 30–45 s after ESP32 boots; or check heartbeat in Serial Monitor. |
| Product not added to cart | Refresh the POS page to reconnect the WebSocket, then scan again. |
