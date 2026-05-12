# ERSIS – Enterprise Retail & Strategic Inventory System

> A full-stack, IoT-enabled retail management platform with AI-powered forecasting, a real-time Point of Sale (POS) interface, a web admin dashboard, and a customer-facing mobile app.

---

## Tech Stack

| Layer | Technology |
| :--- | :--- |
| **Backend API** | Python 3.13 · FastAPI · SQLAlchemy · MySQL 8.0 |
| **Authentication** | JWT (Access + Refresh tokens) · OTP / 2FA (Email) |
| **AI / ML** | Groq LLM · FAISS (RAG) · Sentence Transformers · Prophet (Forecasting) |
| **IoT** | ESP32 · GM67 Barcode Scanner · WiFi/HTTP · WebSocket |
| **Web Frontend** | React 19 · Vite · TailwindCSS |
| **Mobile App** | React Native · Expo (iOS / Android / Web) |
| **DevOps** | Docker · Docker Compose |

---

## Features

### Admin Web Dashboard
- Product & inventory management with barcode scanner support
- Supplier & purchase order management
- Staff, cashier, and customer user management
- AI-powered demand forecasting & sales analytics
- Discount & promotion management
- RAG-based AI chatbot powered by store knowledge base
- Transaction history & refund management
- Report generation & CSV export

### Cashier POS Interface
- Real-time barcode scanning via IoT (ESP32 WiFi scanner → WebSocket)
- **Scanner status indicator** — live Online/Offline/No Device badge in POS header
- **IoT Devices settings panel** — heartbeat monitoring, RSSI signal strength, firmware info
- Customer search & quick registration
- Cart management with discount application
- Multi-payment method checkout
- Receipt generation & printing

### Customer Mobile App (React Native)
- Email OTP registration & verification flow
- Purchase history with period filtering (All / This Week / This Month / Refunds)
- Loyalty points tracking & analytics
- Offer & deals browser
- AI chat support
- Profile management & account security
- Push notifications

---

## Project Structure

```
Enterprise-Retail-Strategic-Inventory-System/
├── backend/                  # FastAPI backend (Python 3.13)
│   ├── app/
│   │   ├── core/             # Config, JWT, security
│   │   ├── models/           # SQLAlchemy ORM models & enums
│   │   ├── routers/          # API route handlers (auth, products, etc.)
│   │   ├── schemas/          # Pydantic request/response schemas
│   │   └── main.py           # App entrypoint
│   ├── seed.py               # Master database seeder
│   └── Dockerfile
├── frontend-web/             # React/Vite admin & cashier UI
│   └── src/
│       ├── pages/admin/      # Admin-only pages
│       ├── pages/cashier/    # POS & cashier pages
│       └── components/       # Shared UI components
├── frontend-mobile/          # React Native / Expo customer app
│   └── myApp/src/
│       ├── screens/          # App screens
│       ├── hooks/            # useAuth, useTheme
│       ├── services/         # API service layer
│       └── navigation/       # Stack & tab navigators
├── iot/                      # ESP32 GM67 firmware (PlatformIO / Arduino)
│   └── Scanner/
│       ├── src/              # main.cpp, WifiManager, HttpClient, BarcodeProcessor
│       ├── include/          # Config.h — all device settings in one file
│       └── platformio.ini    # Build config & board selection
├── mosquitto/                # MQTT broker config
├── docker-compose.yml        # Production orchestration
├── docker-compose.dev.yml    # Development override (hot-reload)
└── SETUP_GUIDE.md            # Detailed setup instructions
```

---

## Quick Start

> For full details, see **[SETUP_GUIDE.md](./SETUP_GUIDE.md)**.

### Option A — Docker (Recommended)

The easiest way to run the full web stack with a single command.

**Prerequisites:** [Docker Desktop](https://www.docker.com/products/docker-desktop/)

```bash
# 1. Clone the repo
git clone https://github.com/sachincode11/Enterprise-Retail-Strategic-Inventory-System.git
cd Enterprise-Retail-Strategic-Inventory-System

# 2. Configure environment files
cp .env.docker.example .env
cp backend/.env.example backend/.env
# Edit both files: set GROQ_API_KEY, SMTP_*, JWT_SECRET_KEY

# 3. Start all services
docker compose up -d --build

# 4. Seed the database (first run only)
docker compose exec backend python seed.py
```

| Service | URL |
| :--- | :--- |
| **Web App** | http://localhost |
| **API Docs** | http://localhost:8000/docs |

---

### Option B — Manual Setup

Use when Docker is not available.

**Prerequisites:** Python 3.13, Node 20, MySQL 8.0, `uv`

```bash
# 1. Clone the repo
git clone https://github.com/sachincode11/Enterprise-Retail-Strategic-Inventory-System.git
cd Enterprise-Retail-Strategic-Inventory-System

# 2. Backend
cd backend
cp .env.example .env          # Edit with DB, GROQ_API_KEY, SMTP_*, JWT_SECRET_KEY
uv venv && uv sync
.venv\Scripts\activate        # Windows
# source .venv/bin/activate   # macOS/Linux
python seed.py
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000

# 3. Web Frontend (new terminal)
cd frontend-web
npm install && npm run dev    # Opens at http://localhost:5173
```

---

### Mobile App (Both Methods)

```bash
cd frontend-mobile/myApp
npm install
npx expo start
```
Scan the QR code with **Expo Go** on your phone.

> [!IMPORTANT]
> For physical device testing: your phone and computer must be on the **same Wi-Fi network**, and **Port 8000** must be allowed through your firewall.

---

### IoT Barcode Scanner

The ESP32 GM67 scanner connects over WiFi and pushes scans to the POS in real time.

```bash
# 1. Edit firmware config
#    iot/Scanner/include/Config.h:
#      WIFI_SSID, WIFI_PASSWORD, API_BASE_URL (your LAN IP)

# 2. Flash via PlatformIO in VS Code
#    Open iot/Scanner/ → click Upload

# 3. Start backend on LAN
cd backend
python -m uvicorn app.main:app --reload --host 0.0.0.0 --port 8000


# 4. Check cashier settings → IoT Devices (/#/cashier/s3)
#    Device appears green within 30 s
```

> See **[IOT_GUIDE.md](./IOT_GUIDE.md)** for full wiring diagrams, troubleshooting, and security configuration.

---

## Default Credentials

After seeding, use these accounts:

| Role | Email | Password |
| :--- | :--- | :--- |
| **Admin** | `admin_seed@store.np` | `Password@123` |
| **Cashier** | `cashier_seed1@store.np` | `Password@123` |
| **Customer** | `customer_seed1@store.np` | `Password@123` |

> **Note:** Seeded customer accounts have `is_verified = true` by default. New mobile registrations require email OTP verification.

---

## Documentation

- **[SETUP_GUIDE.md](./SETUP_GUIDE.md)** — Full setup instructions for Docker, manual, and mobile

---

## Docker Commands

```bash
# Start (production)
docker compose up -d --build

# Start (development with hot-reload)
docker compose -f docker-compose.yml -f docker-compose.dev.yml up --build

# View logs
docker compose logs -f backend

# Rebuild single service
docker compose up -d --build backend

# Stop (keep data)
docker compose down

# Stop + wipe all data
docker compose down -v
```

---

*Built as part of a Systems Development Group Project.*