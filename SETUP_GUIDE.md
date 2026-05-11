# ERSIS - Setup & Installation Guide

This guide provides step-by-step instructions on how to clone the Enterprise-Retail-Strategic-Inventory-System (ERSIS) locally, set up the MySQL database, run the backend, seed the database with initial data, and start the frontend web application.

---

## 1. Clone the Project Locally

1. Open your terminal or command prompt.
2. Navigate to the directory where you want to store the project.
3. Clone the repository using Git:
   ```bash
   git clone <repository_url>
   cd Enterprise-Retail-Strategic-Inventory-System
   ```
*(Note: Replace `<repository_url>` with the actual Git URL of this project).*

---

## 2. MySQL Database Setup

The application uses MySQL. The backend is configured to automatically create the database schema (tables) upon first run.

### Step 2.1: Create the Database
1. Open your MySQL client (e.g., **MySQL Workbench** or terminal).
2. Connect to your local MySQL server (default user is usually `root`).
3. Run the following SQL command to create the database:
   ```sql
   CREATE DATABASE ersis;
   ```

### Step 2.2: Configure Environment Variables
1. Navigate to the `backend/` folder.
2. Copy the example environment file:
   ```bash
   cp .env.example .env
   ```
3. Open the newly created `.env` file and ensure the `DATABASE_URL` matches your local credentials:
   ```env
   DATABASE_URL=mysql+pymysql://root:YOUR_PASSWORD@localhost/ersis
   ```
   *(Replace `YOUR_PASSWORD` with your actual MySQL password).*

4. Similarly, navigate to `frontend-web/` and copy its example file:
   ```bash
   cd ../frontend-web
   cp .env.example .env
   ```

---

## 3. Backend Setup & Global Seeding

The backend is built with Python and FastAPI. It uses `uv` for ultra-fast package management.

### Step 3.1: Install Dependencies
1. Navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. Install `uv` if you don't have it:
   ```bash
   pip install uv
   ```
3. Initialize the virtual environment and sync dependencies:
   ```bash
   uv venv
   uv sync
   ```
4. Activate the virtual environment:
   - **Windows**: `.venv\Scripts\activate`
   - **macOS/Linux**: `source .venv/bin/activate`

### Step 3.2: Run the Global Seeder
Instead of importing a static SQL file, we use a master `seed.py` script to build and populate the database with fresh test data.
1. Ensure your MySQL server is running and the `ersis` database is created.
2. Inside the `backend/` directory, run:
   ```bash
   python seed.py
   ```
3. This will create all tables and seed the database with:
   - Admin, Cashiers, and 10 Customers.
   - Products, Categories, and Suppliers.
   - 80 Historical Transactions (past 2 months).
   - Knowledge Base (FAQs and Store Policies).
   - AI Forecasts and Chatbot data.

### Step 3.3: Run the Backend Server
1. Start the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
2. The server will start at `http://127.0.0.1:8000`. Documentation is available at `http://127.0.0.1:8000/docs`.

---

## 4. Frontend Web Setup

The frontend is built with React and Vite.

1. Open a **new terminal window** (keep the backend running).
2. Navigate to the `frontend-web/` directory:
   ```bash
   cd frontend-web
   ```
3. Install dependencies and start the dev server:
   ```bash
   npm install
   npm run dev
   ```
4. Open the URL provided (typically `http://localhost:5173`) in your browser.

---

## Default Login Credentials
After running the `seed.py` script, you can use these accounts to explore the system:

| Role | Email / Username | Password |
| :--- | :--- | :--- |
| **Admin** | `admin_seed@store.np` | `Password@123` |
| **Cashier** | `cashier_seed1@store.np` | `Password@123` |
| **Customer** | `customer_seed1@store.np` | `Password@123` |

Happy Coding!
