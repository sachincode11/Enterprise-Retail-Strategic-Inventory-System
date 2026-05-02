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

## 2. MySQL Database Setup (via MySQL Workbench)

The application uses MySQL. We need to create a database named `ersis` and import the initial schema from the `ersis.sql` file.

### Step 2.1: Create the Database
1. Open **MySQL Workbench** and connect to your local MySQL server (default user is usually `root`).
2. In the query window, run the following SQL command to create the database:
   ```sql
   CREATE DATABASE ersis;
   ```
3. Refresh the schemas panel on the left side to see the new `ersis` database.

### Step 2.2: Import the Database Schema
1. In MySQL Workbench, go to **Server** -> **Data Import** from the top menu.
2. Select **Import from Self-Contained File**.
3. Browse and select the `ersis.sql` file located in the root of the cloned project folder.
4. Under "Default Target Schema", choose `ersis` from the dropdown list.
5. Click **Start Import** in the bottom right corner.
6. Once the import is successful, the `ersis` database will be populated with all the necessary tables.

### Step 2.3: Configure the Backend Environment Variables
1. Navigate to the `backend/` folder.
2. Open the `.env` file. Ensure that the `DATABASE_URL` matches your local MySQL credentials. For example:
   ```env
   DATABASE_URL=mysql+pymysql://root:password@localhost/ersis
   ```
   *(Change `root` and `password` to your actual MySQL username and password).*

---

## 3. Backend Setup & Running `seed.py`

The backend is built with Python and FastAPI. It uses `uv` for package management.

### Step 3.1: Install Dependencies
1. Open a terminal and navigate to the `backend/` folder:
   ```bash
   cd backend
   ```
2. The backend uses **uv** for ultra-fast Python package management. You need to install `uv` first if you don't have it.
   ```bash
   pip install uv
   ```

3. Create a virtual environment using `uv`:
   ```bash
   uv venv
   ```
4. Activate the virtual environment:
   - **On Windows**:
     ```cmd
     .venv\Scripts\activate
     ```
   - **On macOS/Linux**:
     ```bash
     source .venv/bin/activate
     ```
5. Install the exact project requirements from the lockfile:
   ```bash
   uv sync
   ```

### Step 3.2: Seed the Database
To populate the database with initial users, products, stores, and suppliers, run the `seed.py` script.
1. Ensure your virtual environment is activated and your MySQL server is running.
2. Inside the `backend/` directory, run:
   ```bash
   python seed.py
   ```
3. You should see terminal output indicating that the records have been successfully inserted into the database.

### Step 3.3: Run the Backend Server
1. With the virtual environment activated, start the FastAPI server:
   ```bash
   python -m uvicorn app.main:app --reload
   ```
2. The backend server will start running at `http://127.0.0.1:8000`. You can visit `http://127.0.0.1:8000/docs` to see the interactive Swagger UI.

---

## 4. Frontend Web Setup

The frontend is built with React and Vite.

1. Open a **new terminal window** (keep the backend running in the previous terminal).
2. Navigate to the `frontend-web/` directory:
   ```bash
   cd frontend-web
   ```
3. Install the NPM dependencies:
   ```bash
   npm install
   ```
4. Start the frontend development server:
   ```bash
   npm run dev
   ```
5. The terminal will output a local URL (typically `http://localhost:5173`). Open this URL in your web browser to access the ERSIS application.

---

## Default Login Credentials
After seeding the database, you can log in using the following default credentials (verify in your `seed.py` file if these change):
- **Admin Access:**
  - Username/Email: `admin@example.com` or `admin`
  - Password: *(Check `seed.py` or the database for the exact password, typically `password123` or similar).*
- **Cashier Access:**
  - Username/Email: `cashier1@example.com` or `cashier1`
  - Password: *(Check `seed.py`)*

Happy Coding!
