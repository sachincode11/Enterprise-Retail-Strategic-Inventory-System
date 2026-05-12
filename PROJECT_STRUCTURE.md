# Enterprise-Retail-Strategic-Inventory-System (ERSIS)
## Project Structure Documentation

This document provides a comprehensive map of the application architecture, detailing every core file and folder in the ERSIS ecosystem.

---

### 📂 Root Directory (`/`)
The entry point for the entire full-stack ecosystem, containing orchestration and global documentation.

- **`README.md`**: High-level overview, quick-start, and tech stack info.
- **`SETUP_GUIDE.md`**: Detailed installation instructions for Docker, Manual, and Mobile setups.
- **`IOT_GUIDE.md`**: The definitive guide for the ESP32 Barcode Scanner (Wiring, Firmware, and Backend sync).
- **`PROJECT_STRUCTURE.md`**: This file.
- **`docker-compose.yml`**: Production container orchestration (MySQL, Mosquitto, Backend, Frontend).
- **`docker-compose.dev.yml`**: Development override for hot-reloading backend and frontend.
- **`backend/`**: FastAPI (Python) backend application.
- **`frontend-web/`**: React/Vite admin and cashier web application.
- **`frontend-mobile/`**: React Native (Expo) customer-facing mobile application.
- **`iot/`**: ESP32 Firmware source code (PlatformIO project).
- **`mosquitto/`**: MQTT broker configuration.
- **`ersis.sql`**: Database schema snapshot.

---

### 🐍 Backend (`/backend`)
FastAPI system handling business logic, security (JWT), and the MySQL database.

- **`app/`**: Core package.
  - **`main.py`**: App entry point (FastAPI factory).
  - **`models/`**: SQLAlchemy ORM models.
  - **`routers/`**: Domain-specific API handlers (auth, products, transactions, iot).
  - **`schemas/`**: Pydantic validation models.
  - **`core/`**: JWT security, hashing, and configuration.
- **`.env`**: Local environment variables (DB URL, Secrets, AI Keys).
- **`seed.py`**: Master seeder to populate the database with demo data.
- **`pyproject.toml`**: Dependency management via `uv`.

---

### ⚛️ Frontend Web (`/frontend-web`)
Vite-powered React application for Admins and Cashiers.

- **`src/`**: React source code.
  - **`pages/admin/`**: Admin dashboard, inventory management, reports.
  - **`pages/cashier/`**: POS interface, transactions, and IoT device settings.
  - **`components/`**: Shared UI components (Modals, Toggles, Cards).
  - **`hooks/`**: Custom logic hooks (e.g., `useScannerSocket.js` for IoT).
  - **`context/`**: Global state (Auth, Cashier/Cart).
  - **`services/`**: API interaction layer (apiClient).
- **`vite.config.js`**: Dev server and proxy configuration.

---

### 📱 Frontend Mobile (`/frontend-mobile`)
React Native / Expo app for customers to browse deals, track points, and chat with AI.

- **`src/`**: Source code for screens, navigation, and services.
- **`app.json`**: Expo configuration.

---

### 📡 IoT Scanner (`/iot/Scanner`)
C++ Firmware for the ESP32-based GM67 barcode scanner.

- **`src/`**: Implementation files (`main.cpp`, `WifiManager.cpp`, `ErsisHttpClient.cpp`).
- **`include/`**: Header files and central `Config.h`.
- **`platformio.ini`**: Build system and library configuration.

---

### 🐳 Docker & Infrastructure
- **`mosquitto/`**: Contains `mosquitto.conf` for the MQTT broker.
- **`Dockerfile`**: (Inside backend/frontend) Instructions for building container images.
