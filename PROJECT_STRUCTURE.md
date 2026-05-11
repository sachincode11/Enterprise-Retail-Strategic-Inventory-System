# Enterprise-Retail-Strategic-Inventory-System (ERSIS)
## Project Structure Documentation

This document provides a comprehensive and clean explanation of every file and folder present in the project directory, giving a clear map of the application architecture.

---

### Root Directory (`/`)
The root directory acts as the entry point for both the backend and frontend components of the system, along with general project configurations.

- **`.git/`**: The hidden directory containing the Git version control system repository. It tracks all changes made to the codebase.
- **`.gitignore`**: Specifies intentionally untracked files and directories that Git should ignore (e.g., node_modules, virtual environments).
- **`README.md`**: The primary documentation file for the project, typically containing high-level overviews, setup instructions, and startup commands.
- **`ai-services/`**: A directory intended for Artificial Intelligence microservices, models, and integrations (e.g., inventory forecasting, chatbots).
- **`api.json`**: A static JSON snapshot of the system's API schema, likely containing OpenAPI (Swagger) definitions for API documentation and frontend generation.
- **`backend/`**: The main backend application built with Python and FastAPI. Contains all server-side logic, routing, and database interactions.
- **`ersis.sql`**: The initial SQL script used for bootstrapping the database schema or performing manual migrations.
- **`frontend-web/`**: The main web frontend application built using React and Vite. Contains all client-side logic, user interfaces, and state management.
- **`implementation_plan.md`**: A detailed documentation file defining the project's roadmap, architectural decisions, features, and implementation strategies.
- **`iot/`**: A directory intended for Internet of Things (IoT) integrations, such as Point of Sale (POS) hardware, receipt printers, or RFID scanners.

---

### Backend Directory (`/backend`)
Contains the Python FastAPI backend system that handles business logic, security, and database management.

- **`.env`**: Environment variables configuration file storing sensitive backend data such as database URLs, API keys, and secret keys.
- **`.python-version`**: A specification file indicating the exact Python version required to run this backend.
- **`.venv/`**: A Python virtual environment folder containing all isolated dependencies installed for the backend.
- **`pyproject.toml`**: The modern configuration file for Python packaging, dependency management, and build tools (likely used by the `uv` tool).
- **`seed.py`**: A database seeding script used to populate the database with initial, dummy, or test data for development purposes.
- **`uv.lock`**: A lockfile created by the `uv` package manager, ensuring deterministic dependency resolution across all environments.
- **`app/`**: The main Python package holding the FastAPI application source code.
  - **`core/`**: Contains core configurations, security dependencies, JWT token handling, and global settings.
  - **`models/`**: Contains SQLAlchemy Object-Relational Mapping (ORM) classes representing database tables.
    - `models.py`: Database table schemas (e.g., Users, Products, Stores).
    - `enums.py`: Enumeration classes used within the database models.
  - **`routers/`**: Contains FastAPI route handlers (controllers) grouped by domain.
    - `admin.py`: API endpoints for administrative functionalities.
    - `auth.py`: API endpoints handling user authentication and token generation.
    - `products.py`: API endpoints for product CRUD operations.
    - `transactions.py`: API endpoints handling sales, checkout, and inventory transactions.
  - **`schemas/`**: Pydantic models used for validating incoming request payloads and serializing outgoing API responses.
  - **`utils/`**: Shared helper functions, external service integrations, and utility scripts.
  - **`database.py`**: Configures the SQLAlchemy database engine, session makers, and connection logic.
  - **`main.py`**: The entry point of the FastAPI application. It initializes the app, registers routers, and sets up CORS.

---

### Frontend Directory (`/frontend-web`)
Contains the React frontend application optimized and built using the Vite build tool.

- **`.env`**: Environment variables specific to the React frontend (e.g., `VITE_API_BASE_URL`).
- **`index.html`**: The main entry HTML document. Vite injects the compiled JavaScript into this file to run the React app.
- **`package.json`**: The core NPM configuration file detailing project metadata, build scripts, and dependencies.
- **`package-lock.json`**: An NPM lockfile ensuring the exact same versions of node modules are installed across environments.
- **`vite.config.js`**: Configuration file for the Vite bundler and development server.
- **`tailwind.config.js`**: Configuration file defining utility classes, themes, and design tokens for Tailwind CSS.
- **`postcss.config.js`**: Configuration for PostCSS, typically used to process Tailwind CSS.
- **`node_modules/`**: Directory containing all downloaded NPM packages and frontend dependencies.
- **`src/`**: The main source code directory where the React application resides.
  - **`App.jsx`**: The root React component that sets up application routing and global context providers.
  - **`main.jsx`**: The entry point that mounts the `App` component into the DOM.
  - **`assets/`**: Static assets like images, icons, and global fonts that are bundled with the app.
  - **`components/`**: Highly reusable UI building blocks (e.g., buttons, modals, form inputs) used across various pages.
  - **`context/`**: React Context API files used for global state management (e.g., user authentication state, cart state).
  - **`data/`**: Static JSON data, hardcoded constants, or mock data.
  - **`hooks/`**: Custom React hooks abstracting complex component logic into reusable functions.
  - **`layouts/`**: Structural components wrapping pages (e.g., `AdminLayout`, `CashierLayout`, `Sidebar`, `Navbar`).
  - **`pages/`**: High-level view components mapping to specific route URLs.
    - `admin/`: Pages strictly for administrators (e.g., `Dashboard.jsx`, `Products.jsx`, `Customers.jsx`, `Discounts.jsx`, `Reports.jsx`). Contains forms and complex data tables.
    - `cashier/`: Pages for the cashier Point of Sale interface (e.g., `POS.jsx`, `Transactions.jsx`, `Receipt.jsx`).
  - **`services/`**: The API interaction layer. These files handle all HTTP requests to the backend.
    - `apiClient.js`: An Axios/Fetch instance pre-configured with the base URL and authentication interceptors.
    - `authService.js`, `productService.js`, `transactionService.js`, etc.: Domain-specific modules encapsulating API calls.
  - **`styles/`**: Global CSS stylesheets or styling definitions.
  - **`utils/`**: Helper files containing reusable utility functions (e.g., date formatting, currency calculation).
