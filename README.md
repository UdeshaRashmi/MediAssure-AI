<div align="center">
  <img src="frontend/src/logo1-transparent-tight.png" alt="MediAssure AI logo" width="120" />

  <h1>MediAssure AI</h1>
  <p><strong>Find available medicines. Connect local suppliers. Coordinate pickup.</strong></p>
  <p>A medicine availability and inventory platform for patients, pharmacies, and hospitals in Sri Lanka.</p>
  <p>
    <a href="#project-overview">Overview</a> &bull;
    <a href="#first-time-setup-for-beginners">Get started</a> &bull;
    <a href="#using-the-application">User guide</a> &bull;
    <a href="#sri-lanka-medicine-map">Sri Lanka map</a> &bull;
    <a href="#testing-and-verification">Testing</a>
  </p>
</div>

---

## Project overview

MediAssure AI helps people find medicines held by registered pharmacies and hospitals, while giving suppliers a place to maintain their own stock and manage reservations. A patient searches for a medicine and quantity, compares available locations, and submits a reservation. The supplying institution then confirms the request and records pickup.

The current application uses real records entered through its forms and stored in PostgreSQL. It does not automatically create sample accounts, pharmacies, medicines, reservations, alerts, or predictions. An empty database produces empty states until users add their information.

The project also provides a foundation for future demand forecasting and stock redistribution research. Those capabilities are distinguished from the features implemented today in [Current limitations and future work](#current-limitations-and-future-work).

## Contents

- [First-time setup for beginners](#first-time-setup-for-beginners)
- [Implemented features](#implemented-features)
- [Roles and access](#roles-and-access)
- [Technology and architecture](#technology-and-architecture)
- [Local setup](#local-setup)
- [Docker Desktop walkthrough](#docker-desktop-walkthrough)
- [Browse database tables](#browse-database-tables)
- [Configuration](#configuration)
- [Using the application](#using-the-application)
- [Sri Lanka medicine map](#sri-lanka-medicine-map)
- [Location detection and language support](#location-detection-and-language-support)
- [Inventory and reservation rules](#inventory-and-reservation-rules)
- [API reference](#api-reference)
- [Testing and verification](#testing-and-verification)
- [Troubleshooting](#troubleshooting)
- [Project structure](#project-structure)
- [Current limitations and future work](#current-limitations-and-future-work)
- [Additional documentation](#additional-documentation)

## First-time setup for beginners

Start here if you have not used Python, Node.js, Docker, or a terminal before. Follow the steps in order. The detailed sections later in this README explain each part further.

### Step 1: Install the required applications

Install these Windows applications using their official installation instructions:

| Application | Official website | Why it is needed |
| --- | --- | --- |
| Visual Studio Code | <https://code.visualstudio.com/> | Open the project and run commands in its terminals |
| Python 3.11 or newer | <https://www.python.org/downloads/> | Run the FastAPI backend |
| Node.js 20 or newer, including npm | <https://nodejs.org/en/download> | Run the React frontend |
| Docker Desktop for Windows | <https://docs.docker.com/desktop/setup/install/windows-install/> | Run PostgreSQL and the database table browser |

Complete any Windows prerequisites requested by the Docker installer and restart Windows if asked. After installation, close and reopen Visual Studio Code so newly installed commands are available.

You do not need to install PostgreSQL or Redis separately on Windows for this setup.

### Step 2: Open the project folder

1. Obtain the project files. If downloaded as a ZIP, extract the ZIP before continuing.
2. Open Visual Studio Code.
3. Choose **File > Open Folder** and select the extracted `MediAssure-AI` folder.
4. Check the Explorer panel on the left. You should see `backend`, `frontend`, `README.md`, and `docker-compose.yml` directly inside the opened folder.

If another `MediAssure-AI` folder is nested inside the folder you opened, open that inner folder instead. Commands must run against the folder containing `docker-compose.yml`.

### Step 3: Understand the terminals

A terminal is the panel where you type commands. In Visual Studio Code, choose **Terminal > New Terminal** to open one. Use a **PowerShell** terminal for this guide.

- Copy only the commands inside a code block, not a prompt such as `PS C:\...>` or the output shown after a command.
- Paste a command and press **Enter**. Wait for it to finish before continuing.
- Installation commands eventually return to a prompt. Backend and frontend server commands keep running; leave those terminals open.
- To open a terminal in a specific folder, right-click `backend` or `frontend` in the Explorer panel and choose **Open in Integrated Terminal**.

The normal working setup is:

| Terminal | Folder | Used for |
| --- | --- | --- |
| Database setup | Project root | Docker commands; this terminal can be reused after commands finish |
| Backend | `backend` | Running the API; leave it open |
| Admin setup | `backend` | Creating your administrator account once |
| Frontend | `frontend` | Running the website; leave it open |

### Step 4: Start Docker and the database

Open **Docker Desktop** from the Windows Start menu and wait for its engine to start. Keep it running.

Open a PowerShell terminal in the project root. Check the location and installed commands:

```powershell
Get-Location
python --version
node --version
npm.cmd --version
docker info
```

`Get-Location` should show the project root. The version commands should print versions; `docker info` should include server information. If a command is not recognized, finish its installation and reopen the terminal before continuing.

Start the database and supporting services:

```powershell
docker compose up -d db redis adminer
docker compose ps
```

The first run downloads software images and may take several minutes. Wait for the command to finish. In Docker Desktop, expand the `mediassure-ai` group and check the containers are running. The `db` service should become healthy.

If the command reports that the Docker engine cannot be reached, do not continue with database migrations yet. Open Docker Desktop, let it finish starting, and retry this step.

### Step 5: Prepare and run the backend

In the Explorer panel, right-click **backend > Open in Integrated Terminal**. The prompt should end in `\backend>`.

Run these first-time setup commands:

```powershell
if (!(Test-Path .venv)) { python -m venv .venv }
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
```

Wait until package installation and migration both finish successfully. Then start the API:

```powershell
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

When the terminal reports that application startup is complete, open <http://localhost:8001/docs>. Seeing the API documentation confirms that the server is responding.

Leave this terminal running. Do not type frontend or account-setup commands into it while the server is active.

If setup produces an error, use [Troubleshooting](#troubleshooting) before moving on. If a `backend/.env` file already existed, check that its database URL uses port `5433`, as shown in [Configuration](#configuration).

### Step 6: Create your first Admin account

Right-click **backend > Open in Integrated Terminal** again to create a separate terminal. Run:

```powershell
.\.venv\Scripts\python.exe -m app.create_admin
```

The command asks for:

```text
Name:
Email:
Password:
Confirm password:
```

Enter your own details and press Enter after each one. Password characters are deliberately hidden, so the terminal may look unchanged while you type. Enter the same password twice, using at least six non-padding characters.

A successful setup prints `Administrator created. Sign in using the Admin role.` Keep the email/password for the next steps. No default Admin account is supplied, and Admin cannot be created through the website's public Sign up form.

### Step 7: Start the frontend

Right-click **frontend > Open in Integrated Terminal**. The prompt should end in `\frontend>`.

Install its packages:

```powershell
npm.cmd install
```

When installation finishes, start the website:

```powershell
npm.cmd run dev
```

Open the **Local** URL printed by Vite, normally <http://localhost:5173>. If it prints port `5174` instead, open that URL. Leave this terminal running too.

### Step 8: Sign in and add your real data

The application starts without sample stock, so empty screens are expected initially.

1. On the website choose **Sign in**, select **Admin**, and enter the credentials created in Step 6.
2. To create a supplier account, sign out, choose **Sign up**, and register as **Pharmacist** or **Hospital Staff**.
3. Sign back in as Admin, open **Settings**, and approve that staff account.
4. Sign in with the approved staff account and open **My medicine stock > Add medicine**.
5. Enter a medicine and the institution's details. Use **Use my location** while physically at the institution, then check the map before saving its coordinates.
6. Mark the institution **Open** when it is available for pickup. Save the stock.
7. Sign up as a **Patient** to search for the medicine and request a reservation. A separate browser profile can be used to keep a supplier account open at the same time.
8. In the supplier account, inspect **Reservations**, confirm the request, and complete pickup when appropriate.
9. Open **Sri Lanka map** to inspect the locations recorded in the system.

For the complete workflow and stock rules, see [Using the application](#using-the-application) and [Inventory and reservation rules](#inventory-and-reservation-rules).

### Step 9: View the saved database rows

Open <http://localhost:8080> and use the [Adminer connection details](#browse-database-tables). Choose a table's **select** link to view its rows. This login uses the database credentials, not your website's Admin email/password.

### Step 10: Stop safely and run again later

When finished:

1. Press **Ctrl+C** in the frontend terminal.
2. Press **Ctrl+C** in the backend terminal.
3. From a project-root terminal, run `docker compose stop db redis adminer` if you want to stop the supporting services.

For the next session, open Docker Desktop and run:

```powershell
# Project-root terminal:
docker compose up -d db redis adminer
```

Then open a terminal in each indicated folder:

```powershell
# Backend folder:
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

```powershell
# Frontend folder:
npm.cmd run dev
```

Open the frontend URL and sign in with an existing account. You do not need to recreate the Admin account, reinstall packages, or re-enter saved stock every time. Apply new migrations or reinstall dependencies when the project changes. Your saved records remain in the database volume unless that storage is deleted.

## Implemented features

| Area | Available functionality |
| --- | --- |
| Accounts | Signup, role-specific login, persistent sessions, logout, and staff account approval |
| Inventory | Add medicines, update total stock and reorder levels, and view reserved/available units |
| Institution details | Maintain pickup name, address, phone, coordinates, opening hours, and open/closed status |
| Medicine search | Search medicine names, generic names, or categories and compare matching strengths |
| Reservations | Request a hold, confirm it, complete pickup, cancel it, or release an expired hold |
| Sri Lanka map | Explore registered locations, filter by institution type/open status, and inspect available medicines |
| Device location | Fill coordinate fields using browser location permission and check the result on a map |
| Languages | Switch between English and Sinhala, including form validation feedback |
| Monitoring | View stock-derived alerts, account/inventory audit events, and role-specific dashboard summaries |
| Data integrity | Enforce institution ownership, validate inputs, and lock stock rows during reservation changes |

## Roles and access

Each account has a role stored by the backend. Choosing another role on the login screen does not change the account's permissions.

| Role | Account creation | Main workspace |
| --- | --- | --- |
| **Patient** | Public signup with immediate access | Medicine search, emergency request, own reservations, Sri Lanka map, and settings |
| **Pharmacist** | Public signup followed by Admin approval | Pharmacy dashboard, own institution stock and pickup details, incoming reservations, map, alerts, and settings |
| **Hospital Staff** | Public signup followed by Admin approval | Own hospital stock and pickup details, medicine search, outgoing/incoming reservations, map, alerts, and settings |
| **Admin** | Explicit creation using the local setup command | Global stock/reservation oversight, staff approvals, dashboard, map, alerts, and audit history |

**Ownership is checked on the server.** Pharmacists and Hospital Staff can list and update only the stock belonging to their account's institution. Changing a stock ID, request body, or browser navigation does not grant access to another institution's inventory.

Patients see their own reservations. Hospital Staff see requests they created and requests supplied by their hospital; they can confirm or complete only requests supplied by their own hospital. Admin retains global management access.

Professional accounts remain on an approval screen until an Admin approves them. This account approval is separate from a formal pharmacy license or professional registration verification process, which is not yet implemented.

## Technology and architecture

| Layer | Technology | Purpose |
| --- | --- | --- |
| Frontend | React 19, TypeScript, Vite | User interfaces and authenticated API requests |
| Styling | Tailwind CSS, Lucide icons | Layout, visual styling, and interface icons |
| Backend | Python, FastAPI, Pydantic | API endpoints, request validation, and permissions |
| Persistence | SQLAlchemy, Psycopg | Database access and transactional updates |
| Database | PostgreSQL 16 with PostGIS | Accounts, locations, inventory, reservations, and audit records |
| Migrations | Alembic | Versioned database schema changes |
| Mapping | Custom SVG, Natural Earth geometry | Sri Lanka overview with saved institution coordinates |
| Development services | Docker Compose | PostgreSQL/PostGIS and Redis containers |
| CI | GitHub Actions | Backend compilation and frontend production build |

```mermaid
flowchart LR
    Person[Patient / Pharmacist / Hospital Staff / Admin] --> UI[React frontend]
    UI -->|Authenticated API requests| API[FastAPI backend]
    API -->|SQLAlchemy transactions| DB[(PostgreSQL + PostGIS)]
    UI -->|Permission requested by user| Geo[Browser geolocation]
    UI --> Map[Sri Lanka vector map]
    DB -->|Saved locations and stock through API| Map
```

Redis is included in the Compose setup but is not currently used by application flows. The frontend and backend can run locally while the database runs inside Docker, or the complete development stack can run in containers.

## Local setup

The commands below target **Windows PowerShell**. Start from the repository root, the folder containing `docker-compose.yml`. Open a separate terminal for each long-running service.

### Prerequisites

| Requirement | Version / condition |
| --- | --- |
| Python | 3.11 or newer; Docker and CI use Python 3.12 |
| Node.js | 20 or newer; Docker and CI use Node.js 22 |
| npm | Available with the Node.js installation |
| Docker Desktop | Installed, open, and running its Linux engine |

Check the tools before setup:

```powershell
python --version
node --version
npm.cmd --version
docker info
```

### 1. Start the database services

From the repository root:

```powershell
docker compose up -d db redis
docker compose ps
```

Wait until the database is ready. Both services should appear as running; the database container also has a readiness health check.

| Service | Local address | Notes |
| --- | --- | --- |
| PostgreSQL | `localhost:5433` | Database, username, and local development password: `mediassure` |
| Redis | `localhost:6379` | Provisioned for future use |

The database uses host port **5433** so it can coexist with a Windows PostgreSQL installation on port 5432. Inside Docker, the backend connects to `db:5432`.

### 2. Set up and start the backend

Open a terminal at the repository root:

```powershell
cd backend
if (!(Test-Path .venv)) { python -m venv .venv }
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

Using the virtual environment's Python directly avoids the need to activate PowerShell scripts. Keep this terminal open while using the application.

If an existing `.env` file points to port 5432, update its `DATABASE_URL` to the local database URL shown in [Configuration](#configuration).

### 3. Create the administrator account

Open another terminal at the repository root:

```powershell
cd backend
.\.venv\Scripts\python.exe -m app.create_admin
```

Enter the requested name, email, password, and password confirmation. Password characters are hidden while you type. The command creates an approved Admin account and refuses to overwrite an email that already exists.

There are **no default Admin credentials**. Admin is available on the **Sign in** screen but is excluded from public **Sign up**. Create this account once, then sign in using its email, password, and the Admin role.

### 4. Set up and start the frontend

Open another terminal at the repository root:

```powershell
cd frontend
npm.cmd install
npm.cmd run dev
```

Open the URL printed by Vite, normally `http://localhost:5173`. If the port is occupied, Vite may use another port. `npm.cmd` is used here because Windows PowerShell may block `npm.ps1`.

### Local service URLs

| Service | URL |
| --- | --- |
| Web application | <http://localhost:5173> |
| Backend API | <http://localhost:8001> |
| Interactive API documentation | <http://localhost:8001/docs> |
| Database table browser (Adminer) | <http://localhost:8080> |
| API liveness check | <http://localhost:8001/health> |
| Database connectivity check | <http://localhost:8001/health/ready> |

The readiness endpoint checks database connectivity. Schema migrations must also be applied before using operational endpoints.

### Starting the project again

For normal development, repeat only these steps:

1. Open Docker Desktop and run `docker compose up -d db redis` from the repository root.
2. Start Uvicorn from `backend` using the command above.
3. Start Vite from `frontend` using `npm.cmd run dev`.

Reinstall dependencies when their files change, and apply migrations when new revisions are added. Stop the frontend/backend processes with `Ctrl+C` in their terminals. To stop the database services while retaining their volume:

```powershell
docker compose stop db redis
```

Database records are stored in the `postgres_data` Docker volume and survive ordinary container stops and restarts. The volume is persistent storage, not a backup; deleting it removes the database records.

### Alternative: run the complete development stack in Docker

From the repository root:

```powershell
docker compose up --build -d
docker compose ps
```

The backend image applies migrations before starting the API. Create the Admin account inside that container:

```powershell
docker compose exec backend python -m app.create_admin
```

Use either the containerized backend/frontend or the local terminal processes at a time, since they share the same exposed ports. The frontend container runs the Vite development server; this Compose setup is not a production deployment configuration.

## Docker Desktop walkthrough

Docker Desktop runs the project's database and optional supporting services. When you start React and FastAPI from PowerShell, those two processes run outside Docker and will not appear in its container list.

### 1. Open Docker Desktop

1. Open **Docker Desktop** from the Windows Start menu.
2. Wait for the engine to finish starting.
3. Open **Containers** in the left sidebar.

### 2. Create the project containers

For the first run, open a PowerShell terminal in the repository root:

```powershell
docker compose up -d db redis adminer
docker compose ps
```

The first run downloads the required images. Subsequent runs reuse downloaded images and existing database storage. Wait for the services to start before opening Adminer or starting backend migrations.

### 3. Find your services

Return to **Containers** and expand the `mediassure-ai` project using its arrow. The project name can differ if the repository folder has another name.

| Service | Typical container name | Purpose | Access |
| --- | --- | --- | --- |
| `db` | `mediassure-ai-db-1` | PostgreSQL/PostGIS database | `localhost:5433` from Windows |
| `redis` | `mediassure-ai-redis-1` | Supporting service reserved for future use | `localhost:6379` |
| `adminer` | `mediassure-ai-adminer-1` | Browser interface for database tables | <http://localhost:8080> |

Confirm that the required containers are running. The database should also report healthy in `docker compose ps` once ready.

### 4. Open the database table browser

Open <http://localhost:8080> in your browser. Docker Desktop also provides an action to open a container's exposed port.

Use these Adminer values: **PostgreSQL**, server `db`, username `mediassure`, password `mediassure`, database `mediassure`. Then follow [Browse database tables](#browse-database-tables) to inspect records.

Clicking the database container does not display database rows. Its **Files** tab shows container files; Adminer provides the table view.

### 5. Inspect a problem

Select a container and open **Logs** to inspect its output. **Inspect** shows details such as port mappings, and **Stats** shows resource usage. For terminal diagnostics:

```powershell
docker compose ps
docker compose logs --tail 50 db
docker compose logs --tail 50 adminer
```

Use `db` logs for database startup problems and `adminer` logs for table-browser startup problems. Backend and frontend errors appear in their PowerShell terminals when those services run locally.

### 6. Stop and start again

Use the container's **Stop**, **Start**, or **Restart** action. The project row also provides actions for the group. For local-backend development, start only `db`, `redis`, and `adminer` if containerized frontend/backend services also exist.

The equivalent project commands are:

```powershell
# Stop the development support services.
docker compose stop db redis adminer

# Start them again.
docker compose up -d db redis adminer
```

Starting Adminer requires the database; stopping only Adminer does not remove database data. Stopping the database prevents the backend from reading or saving records until it is started again.

### Where the data is kept

The `db` service stores records in the Compose volume normally named `mediassure-ai_postgres_data`. The volume survives normal stops and restarts. Do not delete this volume or use `docker compose down -v` when you want to retain your accounts, medicines, and reservations.

Docker Desktop's **Volumes** view manages stored volumes; it is not a database table editor. Use Adminer to browse rows, and maintain backups separately from the live volume.

For interface details, see the official [Docker Desktop Containers guide](https://docs.docker.com/desktop/use-desktop/container/).

## Browse database tables

Use **Adminer** to view database rows and columns directly in a browser. A separate desktop database application is not required.

From the repository root, with Docker Desktop running:

```powershell
docker compose up -d db adminer
```

Open <http://localhost:8080> and enter:

| Login field | Value |
| --- | --- |
| System | PostgreSQL |
| Server | `db` |
| Username | `mediassure` |
| Password | `mediassure` |
| Database | `mediassure` |

### View saved records

1. Click **Login** using the connection details above.
2. If asked to choose a schema, select **public**.
3. Find the table you want and click **select** next to its name. Clicking the table name itself may open its structure instead of its records.
4. Browse the rows and columns. Use the table filters, sorting, and pagination controls when there are many records.
5. After adding or updating data through the application, refresh the table view to see the saved changes.

| Table | Records you can inspect |
| --- | --- |
| `users` | Registered accounts, roles, and approval status |
| `pharmacies` | Pharmacy and hospital names, pickup addresses, contact details, and coordinates |
| `medicines` | Medicine names, generic names, strengths, and categories |
| `inventory` | Total stock, reserved stock, reorder levels, and institution/medicine references |
| `reservations` | Reservation quantities, status, expiry, and account/institution/medicine references |
| `audit_records` | Recorded inventory, institution, approval, and reservation actions |
| `auth_sessions` | Session token hashes, account references, and expiry times |

Hospital locations are stored in `pharmacies` too. Columns such as `pharmacy_id`, `medicine_id`, and `user_id` link a record to the corresponding table's `id`. An empty result means there are no saved records matching the current table filters.

These are the database development credentials, not an application's Admin email/password. Use `db` as the server because Adminer connects from inside the Docker network; the Windows host port `5433` is not needed here. If the table list is empty, apply the backend migrations first.

Adminer is bound to this computer's loopback interface at port 8080. It connects directly to the database and provides edit/delete operations in addition to viewing. Use the application forms for normal stock and reservation changes so its validation and ownership rules are applied.

To stop the table browser without stopping the database:

```powershell
docker compose stop adminer
```

## Configuration

### Backend: `backend/.env`

The application reads settings from environment variables and `backend/.env`. Copying `.env.example` creates a starting configuration; editing `.env.example` does not update an existing `.env` automatically.

| Variable | Local default | Function |
| --- | --- | --- |
| `APP_ENV` | `development` | Environment label |
| `DATABASE_URL` | See below | PostgreSQL connection used by the API and migrations |
| `CORS_ORIGINS` | `http://localhost:5173,http://localhost:5174` | Allowed frontend origins, separated by commas |
| `REDIS_URL` | `redis://localhost:6379/0` | Reserved configuration; Redis is not yet integrated |
| `JWT_SECRET` | `change-me` | Legacy configuration; current sessions are opaque database-backed tokens, not JWTs |
| `AWS_REGION` | `ap-south-1` | Reserved configuration; current application flows do not use AWS |

For a backend running on Windows with the database in Docker:

```dotenv
DATABASE_URL=postgresql+psycopg://mediassure:mediassure@localhost:5433/mediassure
```

Compose overrides the database and Redis URLs for the backend container to use the `db` and `redis` service names. The supplied credentials are for local development.

### Frontend: `frontend/.env`

The API address defaults to `http://localhost:8001`. Override it when needed:

```dotenv
VITE_API_BASE_URL=http://localhost:8001
```

Restart Vite after changing frontend environment variables. If the frontend origin changes, also update backend `CORS_ORIGINS` and restart the backend. Frontend environment values are included in the browser build and must not contain secrets.

## Using the application

### Approve a pharmacy or hospital account

1. Sign up as **Pharmacist** or **Hospital Staff** using the account owner's details.
2. The new account displays an approval screen.
3. Sign in as **Admin**, open **Settings**, and approve the staff account.
4. Return to the staff account and check approval or sign in again.

### Add and maintain institution stock

1. Open **My medicine stock** and select **Add medicine**.
2. Enter the medicine name, generic name, strength where applicable, category, and prescription requirement.
3. For the first entry, supply the institution's name, address, phone, coordinates, opening hours, and open/closed status.
4. Enter total stock and the reorder level, then save.
5. Add further medicines without re-entering the saved institution profile.
6. Use **Update stock** to change total stock or reorder levels. Existing reserved units cannot be overwritten.
7. Use **Medicine pickup location** to update address, phone, coordinates, opening hours, or open/closed status.

Each supplier account currently owns one institution. Shared access for multiple staff accounts at the same institution is not implemented. Stock management data remains in PostgreSQL when the backend restarts.

### Search for medicine and request a reservation

1. Sign in as a **Patient**, or use an approved **Hospital Staff** account.
2. Open the medicine finder or emergency request screen.
3. Enter the medicine, requested quantity, and your location.
4. Search to view matching medicine strengths at open institutions with enough unreserved stock.
5. Review the address, phone, available quantity, and stock update time. Contact the institution to confirm pickup arrangements.
6. Submit a reservation and track it on **Reservations**.
7. The supplying institution confirms the request and completes pickup when the medicine is collected.

You can edit the search fields at any time and submit again. Editing clears the previous results so they cannot be mistaken for matches to the new inputs. **Clear search** empties the medicine and coordinates, resets quantity to `1`, and removes results and validation errors. This only resets the search form; it does not delete saved inventory or reservations.

Hospital Staff can both maintain their own stock and request medicines from another institution. An outgoing request does not grant permission to confirm that other institution's reservation.

## Sri Lanka medicine map

Open **Sri Lanka map** from the sidebar using any approved account, including Patient. The map shows the locations actually registered in this system using their saved coordinates.

- Select a pin or list entry to inspect the institution's address, phone, opening status, and available medicines.
- Filter by institution name/address, Pharmacy or Hospital, and open status.
- Zoom in or out; a selected location becomes the zoom focus. Reset returns to the country overview.
- Inspect closed locations, or enable **Open only** to hide them.
- Refresh the page data to retrieve stock/location changes made by other users.

Records with missing coordinates or outside the Sri Lanka map extent remain in the list without an invented pin position. This is an overview of registered locations, not a complete directory of every pharmacy or hospital in Sri Lanka. Access requires an approved account.

The outline is bundled from [Natural Earth 1:50m Admin 0 countries](https://github.com/nvkelso/natural-earth-vector/blob/master/geojson/ne_50m_admin_0_countries.geojson), a public-domain dataset. It does not need an external tile service or a map API key. The linked OpenStreetMap view provides a separate street-level map; the custom country overview is not a navigation service.

## Location detection and language support

### Automatic coordinates

Every coordinate-entry form includes **Use my location**: medicine search, emergency requests, initial institution registration, and pickup-location editing.

Click the button and allow location permission. The form fills latitude/longitude, displays the browser's estimated accuracy, and provides a map link for checking the result. Review the location, then explicitly save or search.

For an institution, detect the location while physically at the pharmacy or hospital. Device coordinates are an estimate and do not automatically fill the street address. If permission is denied or detection fails, the existing coordinates remain unchanged and manual entry is available.

Browser geolocation requires `localhost` or HTTPS. A plain HTTP address on a local network may not allow detection.

### English and Sinhala

Use the language selector on the authentication screen or application header. The selected language is saved in the browser and restored after refresh. Navigation, forms, validation messages, and map controls support English and Sinhala. Entered medicine names, addresses, and other records retain their original text.

## Inventory and reservation rules

### Stock accounting

```text
Available stock = Total stock - Reserved stock
```

| Action | Effect |
| --- | --- |
| Create reservation | Increase reserved units; total stock stays unchanged |
| Confirm reservation | Keep the stock hold active |
| Complete pickup | Reduce both total and reserved units by the collected quantity |
| Cancel reservation | Release reserved units; total stock stays unchanged |
| Expire reservation | Release reserved units; total stock stays unchanged |

Reservations use a **15-minute hold**. Confirmation does not extend the original expiry time. Expiry is processed when relevant inventory, reservation, recommendation, or location-stock data is read; there is no background expiry scheduler yet.

```mermaid
stateDiagram-v2
    [*] --> Pending
    Pending --> Confirmed: Supplier confirms
    Pending --> Cancelled: Request cancelled
    Pending --> Expired: Hold expires
    Confirmed --> Completed: Pickup recorded
    Confirmed --> Cancelled: Request cancelled
    Confirmed --> Expired: Hold expires
```

Stock-changing operations use database transactions and row locks. A request exceeding available stock is rejected, and total stock cannot be edited below its reserved quantity.

### Validation

Forms display errors beside the affected field in the selected language and focus the first invalid field on submission. Backend validation independently checks incoming requests.

| Input | Rules |
| --- | --- |
| Required text | Must contain content beyond spaces; field-specific length limits apply |
| Email | Valid supported format; normalized before account lookup |
| Password | At least six characters after removing outer padding for the length check; confirmation must match exactly |
| Phone | Optional for account signup, required for institutions; 7-15 digits with an optional leading `+`, spaces, parentheses, or hyphens |
| Stock and reorder level | Whole numbers from `0` to `2,147,483,647` |
| Reservation quantity | Whole number from `1` to `2,147,483,647`, also limited by available stock |
| Coordinates | Latitude `-90..90`, longitude `-180..180`; finite decimal values and zero are valid |

Passwords are stored as salted PBKDF2-SHA256 hashes. Sessions last eight hours, use opaque bearer tokens whose hashes are stored in the database, and are revoked individually on logout.

## API reference

Interactive request schemas are available at <http://localhost:8001/docs>. For protected endpoints, use **Authorize** with the access token returned by login.

| Method | Endpoint | Access / purpose |
| --- | --- | --- |
| GET | `/health` | Public API liveness |
| GET | `/health/ready` | Public database connectivity check |
| POST | `/auth/signup` | Create Patient or pending professional account |
| POST | `/auth/login` | Authenticate email, password, and stored role |
| GET | `/auth/me` | Current session account, including pending accounts |
| POST | `/auth/logout` | Revoke the current session |
| GET | `/admin/users` | Admin account overview |
| POST | `/admin/users/{id}/approve` | Admin staff approval |
| GET, POST | `/inventory` | Supplier's own stock; Admin retains global management |
| PATCH, DELETE | `/inventory/{id}` | Edit medicine details/stock or remove an owned stock entry; active reservations protect medicine details and deletion |
| GET | `/medicines` | Approved accounts; medicine catalogue |
| GET | `/medicines/search` | Approved accounts; name/generic/category search |
| GET | `/pharmacies` | Approved accounts; registered institution locations |
| GET | `/pharmacies/recommendations` | Approved accounts; available medicine matches |
| GET | `/pharmacies/{id}/stock` | Approved accounts; available stock without private reservation details |
| GET, PATCH | `/pharmacies/mine` | Supplier/Admin's own institution profile |
| GET | `/reservations` | Reservations visible to the account's role and ownership |
| POST | `/reservations` | Patient/Hospital Staff request using inventory ID and quantity |
| PATCH | `/reservations/{id}` | Authorized cancellation, supplier confirmation, or pickup completion |
| GET | `/dashboard/summary` | Pharmacist/Admin stock and reservation summary |
| GET | `/operations/alerts` | Supplier/Admin low-stock alerts |
| GET | `/operations/audit-events` | Own events; Admin sees all |
| GET | `/operations/forecasts` | Pharmacist/Admin; currently returns an empty list |
| GET | `/operations/transfers` | Pharmacist/Admin; currently returns an empty list |
| GET | `/operations/verified-alternatives` | Approved accounts; currently returns an empty list |

The `/pharmacies` route name also covers hospital medicine locations. Professional operational access requires approval in addition to authentication.

## Testing and verification

### Backend

With PostgreSQL running and migrations applied, run from `backend`:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m compileall -q app
```

Tests cover authentication, approval, session expiry/logout, institution ownership, stock bounds, reservation transitions, cancellation/expiry releases, hospital supply workflows, map stock responses, and Unicode data.

Integration tests use the configured PostgreSQL database. Each test runs inside an outer transaction that is rolled back, so temporary records are not retained. Database sequences may still advance even though test rows are removed.

### Frontend

Run from `frontend`:

```powershell
npm.cmd test
npm.cmd run build
```

The test suite checks form validation, location detection/error handling, role navigation, and map geometry. The production build also checks TypeScript and bundles the application.

### Responsive browser checks

The interface uses a mobile navigation drawer, card-based stock records on small screens, scrollable dialogs, and a stacked map/details layout until there is room for side-by-side panels. Long account and institution names wrap without expanding the page.

To run the browser checks from `frontend`, install the test browser once and run:

```powershell
npx.cmd playwright install chromium
npm.cmd run test:e2e
```

Playwright starts a dedicated Vite server on port `5178` and tests 320px, 390px, 768px, 1024px, and 1440px viewports. It checks English/Sinhala layouts, page overflow, mobile navigation/focus, inventory cards/tables, dialog scrolling, and map controls/details. API responses are intercepted with temporary test fixtures; these browser tests do not create database records. Failure screenshots are written to the ignored `frontend/test-results` folder.

### Manual acceptance workflow

| Check | Expected result |
| --- | --- |
| Register professional account | Approval screen until Admin approves |
| Add pharmacy and hospital stock | Records appear in each supplier's own stock workspace |
| Try another institution's stock ID | Update rejected for Pharmacist/Hospital Staff |
| Search for available medicine | Open institutions with sufficient unreserved stock appear |
| Reserve, confirm, and complete pickup | Held units and total stock change according to the stock table above |
| Cancel or let a hold expire | Reserved units are released when processed |
| Open Sri Lanka map | Saved locations and current available medicines can be inspected |
| Detect device location | Coordinates fill after permission, with error feedback on failure |
| Change to Sinhala | Interface changes; entered records remain unchanged |
| Restart backend | Accounts, stock, reservations, and audit history persist |

The current GitHub Actions workflow compiles the backend and builds the frontend. It does not currently run the PostgreSQL integration suite or frontend unit suite.

## Troubleshooting

| Symptom | Likely cause and action |
| --- | --- |
| Docker reports `dockerDesktopLinuxEngine` or cannot connect to the daemon | Open Docker Desktop, wait for its Linux engine, then retry `docker compose up -d db redis` |
| `package.json` not found when using npm | Run frontend commands from `frontend`, not `backend` or the repository root |
| `No module named uvicorn` | Install `backend/requirements.txt` using the virtual environment's Python |
| `.venv\Scripts\python.exe` is not recognized | Move into `backend` first; the virtual environment is inside that folder |
| Database password error on port 5432 | Check that local `DATABASE_URL` uses `localhost:5433`; port 5432 may belong to another PostgreSQL service |
| Database/schema unavailable | Check running containers, then run `python -m alembic upgrade head` using the backend virtual environment |
| Admin is missing from Sign up | Create it using `python -m app.create_admin` from `backend`; choose Admin on Sign in |
| Admin password appears not to type | Hidden password input is expected in the terminal; type it and press Enter |
| Staff account cannot enter the workspace | Sign in as Admin and approve the account in Settings |
| Medicine does not appear in finder results | Check name/strength, available quantity, saved coordinates, and that the supplier is marked Open |
| Institution is listed but has no map pin | Its coordinates are missing or outside the Sri Lanka map area; correct its pickup details |
| Location permission is denied or times out | Allow browser location access, use localhost/HTTPS, retry, or enter coordinates manually |
| Browser reports frontend/backend connection errors | Check API availability, `VITE_API_BASE_URL`, and backend `CORS_ORIGINS` |
| PowerShell blocks `npm.ps1` | Use `npm.cmd` commands as shown in the setup guide |

## Project structure

```text
MediAssure-AI/
|-- backend/
|   |-- app/
|   |   |-- core/             # Settings, password hashing, session/role checks
|   |   |-- db/               # SQLAlchemy base and sessions
|   |   |-- models/           # Persistent records and relationships
|   |   |-- routers/          # API routes
|   |   |-- schemas/          # Request schemas and validation helpers
|   |   |-- services/         # Stock serialization and reservation expiry
|   |   |-- create_admin.py   # Explicit administrator setup
|   |   `-- main.py           # FastAPI application
|   |-- migrations/           # Alembic schema revisions
|   |-- tests/                # Backend validation and integration tests
|   |-- .env.example          # Local configuration template
|   `-- requirements.txt
|-- frontend/
|   |-- src/
|   |   |-- components/       # Shared UI, validation, and location picker
|   |   |-- data/             # Bundled Sri Lanka map geometry
|   |   |-- locales/          # Sinhala interface translations
|   |   |-- pages/            # Role-specific screens
|   |   |-- services/         # Authenticated API and geolocation helpers
|   |   |-- App.tsx           # Application state and page selection
|   |   |-- i18n.tsx          # Language context and browser preference
|   |   `-- roleAccess.tsx    # Frontend navigation permissions
|   |-- tests/                # Frontend unit tests
|   `-- package.json
|-- docs/                     # Architecture and research documentation
|-- .github/workflows/        # CI configuration
`-- docker-compose.yml        # Development services
```

## Current limitations and future work

The current version supports medicine availability, owned stock management, and reservation coordination. The following features are not implemented as operational services:

- Trained medicine-demand, shortage, or arrival-availability prediction models.
- Stock transfer execution or automated redistribution optimization.
- A pharmacist-verified medicine substitution workflow.
- Batch/expiry tracking, sales-history entry, password recovery, or notifications.
- Shared institution access for multiple staff accounts.
- Automated professional/license verification or a background reservation expiry scheduler.

Forecast, transfer, and alternative-medicine screens/endpoints display empty results rather than sample outputs. Distance and travel-time values are estimates from saved coordinates; stock-based ranking is a heuristic, not a trained prediction or live routing service. Suppliers maintain opening status manually.

This system does not independently prescribe medicines or automatically substitute treatments. Existing PostgreSQL records are retained during migrations; data backup and deployment hardening remain operational responsibilities. Sessions currently use browser local storage, and the development setup requires further review before public deployment.

## Additional documentation

- [Architecture](docs/architecture.md)
- [Data model](docs/data-model.md)
- [Research scope](docs/research-scope.md)

These documents provide supporting design and research context. The implemented-feature descriptions and setup instructions above describe the current application.

Medicine stock rows include **Edit** and **Delete** actions on desktop and mobile. Edit opens the medicine details, total stock, and reorder level. Delete asks for confirmation and removes only that institution's stock entry, preserving medicine and reservation history. Complete or cancel active reservations before deleting or changing medicine details; stock quantity can still be updated provided it covers reserved units.
