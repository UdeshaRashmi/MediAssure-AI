# MediAssure AI

Medicine availability and pharmacy coordination using React, FastAPI, and PostgreSQL/PostGIS. The application starts without sample accounts, medicines, pharmacies, reservations, notifications, or predictions. Enter your own records through the application.

## What works

- Persistent signup/login with salted password hashes and expiring, revocable bearer sessions.
- API authorization and interfaces for Patient, Pharmacist, Hospital Staff, and Admin.
- Administrator approval for professional accounts; public signup cannot create administrators.
- Pharmacy registration through its first inventory entry; one pharmacy per operator account.
- Add medicines and update real stock, reorder levels, opening hours, and open/closed availability.
- Search by medicine, generic name, or category and compare available stock at open pharmacies.
- Reservations with a 15-minute hold, pharmacy confirmation, pickup completion, cancellation, and expiry.
- Row locks and database constraints protect reserved stock. Completing pickup reduces total stock; cancellation/expiry releases the hold.
- Low-stock alerts and audit records derived from saved actions.
- English/Sinhala interface switching on login and inside the application, with the preference saved in the browser. Entered names and medicine records remain as entered.

No startup script inserts sample data. Existing database records are preserved during migrations. Integration tests create temporary records inside rolled-back transactions; those records do not remain in the application.

## Roles and interfaces

| Role | Signup/access | Interface and data access |
| --- | --- | --- |
| Patient | Public signup; immediate access | Medicine finder, emergency request, own reservations, account settings |
| Pharmacist | Public signup; Admin approval required | Dashboard, own pharmacy inventory, its reservations, network, alerts, audit/settings |
| Hospital Staff | Public signup; Admin approval required | Medicine finder, hospital account reservations, pharmacy network, alerts, settings |
| Admin | Created explicitly through the local command below | Network overview, stock management, all reservations, audit history, staff account approvals in Settings |

Selecting another role on the login form does not change the account's stored role. The API rejects unauthorized requests even if browser state or navigation is modified. Pharmacists cannot modify another operator's inventory or reservations. Patients and hospital accounts see only their own reservations.

## Run locally on Windows PowerShell

Prerequisites: Python 3.11+, Node.js 20+, npm, and Docker Desktop with the Linux engine running.

### 1. PostgreSQL and Redis

From the project root:

```powershell
cd "C:\My choices\MediAssure-AI"
docker compose up -d db redis
docker compose ps
```

PostgreSQL uses host port **5433**, avoiding a Windows PostgreSQL service on 5432. Local development credentials: database/user/password `mediassure`. Docker services communicate with `db:5432`; Redis is available on `localhost:6379`. Redis is provisioned but not yet used by application flows.

### 2. Backend

```powershell
cd "C:\My choices\MediAssure-AI\backend"
# First setup only; reuse an existing virtual environment.
python -m venv .venv
if (!(Test-Path .env)) { Copy-Item .env.example .env }
.\.venv\Scripts\python.exe -m pip install -r requirements.txt
.\.venv\Scripts\python.exe -m alembic upgrade head
.\.venv\Scripts\python.exe -m uvicorn app.main:app --reload --port 8001
```

If `.env` already exists, ensure it contains:

```dotenv
DATABASE_URL=postgresql+psycopg://mediassure:mediassure@localhost:5433/mediassure
```

Keep the terminal open. API: <http://localhost:8001/docs>. `/health` checks the server; `/health/ready` checks database connectivity. Operational routes require migrations to be at the latest revision.

### 3. Create your administrator

In another terminal, from `backend`, run this once to create your own account:

```powershell
.\.venv\Scripts\python.exe -m app.create_admin
```

Enter your actual name, email, password, and password confirmation. There are no default credentials. The command refuses to overwrite an existing email. It does not insert pharmacy or medicine records.

### 4. Frontend

In another terminal:

```powershell
cd "C:\My choices\MediAssure-AI\frontend"
npm.cmd install
npm.cmd run dev
```

Open the URL printed by Vite, normally <http://localhost:5173>. `npm.cmd` works when PowerShell blocks `npm.ps1`. The frontend API URL defaults to `http://localhost:8001`; set `VITE_API_BASE_URL` in `frontend/.env` to override it and restart Vite. Allowed frontend origins are configured by `CORS_ORIGINS` in `backend/.env`.

For later runs, start Docker services and run only the Uvicorn and Vite commands. Install dependencies again when dependency files change; run migrations when new revisions are added.

The full Docker development stack can also be started with `docker compose up --build -d`. The backend image includes migrations and applies them before starting Uvicorn. To create the administrator inside that backend container, run `docker compose exec backend python -m app.create_admin`. Use one backend runtime at a time to avoid port 8001 conflicts.

## Test with your own data

1. Sign up as a Pharmacist using your own details. The account shows an approval screen.
2. Sign out, sign in with your Admin account and the Admin role, open Settings, and approve the pharmacist. Hospital Staff follows the same approval process.
3. Sign in as the Pharmacist, open Inventory, and choose Add medicine. Enter the actual medicine/generic name, strength, category, pharmacy name/address/phone, coordinates, total stock, and reorder level. Set the pharmacy to Open when appropriate. Save and verify the record appears.
4. Add another medicine under the same pharmacy name. Use Update stock to change total stock; reserved quantities cannot be overwritten. Use Pharmacy availability to maintain opening hours and open/closed status.
5. Sign up as a Patient in another browser profile or sign out first. Search for the medicine, enter coordinates or use the browser's location permission, and specify quantity. Search results include matching strengths and only open pharmacies with enough unreserved stock.
6. Submit a reservation, then check the patient's Reservations page. In the pharmacist account, confirm it and complete pickup. Available stock decreases when reserved; total stock decreases when pickup is completed.
7. Try requesting more units than available. The API must reject it. Cancel another reservation and confirm its held units are released. Active holds expire after 15 minutes; expiry is processed when inventory/reservation/recommendation data is next read.
8. Restart the backend and sign in again. Your accounts, pharmacy, inventory, reservations, and audit records remain in PostgreSQL.
9. Switch Language to Sinhala on the login page or app header. Test signup, inventory, search, and reservations in both languages. The preference survives refresh; medicine names remain unchanged.
10. Verify a Patient cannot access stock-management/admin endpoints and that a second pharmacist cannot edit the first pharmacy's stock or reservations.

Sign out before changing accounts. The database volume is persistent; restarting containers does not erase your records.

## Verification

Run from `backend` after migrations, with PostgreSQL running:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m compileall -q app
```

The API integration suite uses the configured PostgreSQL database with an outer transaction rolled back after every test. It checks role restrictions, approvals, ownership, password hashing, persisted sessions, reservation transitions, stock release, search, and Unicode data. Test inserts can advance database sequences even though test rows are rolled back.

From `frontend`:

```powershell
npm.cmd run build
```

## API overview

| Routes | Access |
| --- | --- |
| `POST /auth/signup`, `POST /auth/login` | Public; no public Admin signup |
| `GET /auth/me`, `POST /auth/logout` | Valid bearer session, including pending accounts |
| `GET /admin/users`, `POST /admin/users/{id}/approve` | Approved Admin |
| `GET/POST /inventory`, `PATCH /inventory/{id}` | Approved Pharmacist/Admin; ownership enforced |
| `GET /medicines`, `GET /medicines/search` | Approved accounts |
| `GET /pharmacies`, `GET /pharmacies/recommendations` | Approved accounts |
| `PATCH /pharmacies/mine` | Approved Pharmacist/Admin; own pharmacy |
| `GET /reservations` | Approved account; scoped by account/pharmacy/role |
| `POST /reservations` | Approved Patient/Hospital Staff; inventory ID and quantity |
| `PATCH /reservations/{id}` | Owner can cancel; pharmacy/Admin can confirm or complete |
| `GET /dashboard/summary` | Approved Pharmacist/Admin |
| `GET /operations/alerts` | Approved Pharmacist/Hospital Staff/Admin |
| `GET /operations/audit-events` | Own events; Admin sees all |

Use the Authorize button in API docs with the token returned by login. Sessions expire after eight hours; logout revokes the current token.

## Current boundaries

Demand forecasting and stock transfer execution are not implemented. Their screens show empty states instead of sample predictions or successful-looking actions. Verified alternatives are empty until a real verification workflow exists. Distance is calculated from coordinates; travel time and stock-based ranking are estimates, not live navigation or trained medical/availability predictions. Opening status is manually maintained by the pharmacy. The system does not prescribe medicines or automatically substitute them.

Batch/expiry tracking, sales-history entry, password recovery, notifications, and pharmacy registration/license verification are future work. A pharmacist account currently owns one pharmacy; Admin edits global stock but Add medicine registers/uses the Admin's own pharmacy. Sessions are stored in browser local storage; HTTPS and deployment hardening are needed for a public deployment.

## Commit reminders

Review and commit the changes in three groups: backend/database, frontend/Sinhala, then documentation. Exact commands are in [the commit guide](docs/commit-guide.md). Commits are not created automatically.

## Structure

```text
backend/app/core/       Settings, password hashing, session and role checks
backend/app/models/     SQLAlchemy records
backend/app/routers/    API endpoints
backend/app/services/   Stock/reservation serialization and expiry
backend/migrations/     Database schema changes; no seed inserts
backend/tests/          Transactional PostgreSQL API tests
frontend/src/pages/     Role-specific screens
frontend/src/services/  Authenticated API client
frontend/src/locales/   Sinhala UI dictionary
frontend/src/i18n.tsx   Language preference and translation context
```
