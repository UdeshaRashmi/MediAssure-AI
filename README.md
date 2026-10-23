# MediAssure AI

Medicine availability and pharmacy coordination using React, FastAPI, and PostgreSQL/PostGIS. The application starts without sample accounts, medicines, pharmacies, reservations, notifications, or predictions. Enter your own records through the application.

## What works

- Persistent signup/login with salted password hashes and expiring, revocable bearer sessions.
- API authorization and interfaces for Patient, Pharmacist, Hospital Staff, and Admin.
- Administrator approval for professional accounts; public signup cannot create administrators.
- Pharmacy/hospital registration through its first inventory entry; one institution per approved supplier account.
- Pharmacists and Hospital Staff can add medicines and update their own institution stock, reorder levels, pickup address/phone/coordinates, opening hours, and open/closed availability.
- Search by medicine, generic name, or category and compare available stock at open pharmacies and hospitals. Results show institution type, address, phone, a map link, available quantity, and stock update time.
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
| Hospital Staff | Public signup; Admin approval required | Own hospital stock and pickup location, medicine finder, outgoing and incoming reservations, network, alerts, settings |
| Admin | Created explicitly through the local command below | Network overview, stock management, all reservations, audit history, staff account approvals in Settings |

Selecting another role on the login form does not change the account's stored role. The API rejects unauthorized requests even if browser state or navigation is modified. Pharmacists and Hospital Staff can list and update only their own institution inventory. Stock IDs are checked against the authenticated account on the server; changing an ID or browser navigation cannot grant write access to another institution. Patients see their own reservations. Hospital Staff see reservations they created and incoming reservations at their own hospital; they can confirm/complete only those supplied by their own hospital. Admin retains global oversight.

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

No schema migration is needed for hospital stock support: the existing location table is reused and the displayed institution type comes from its owner's role.

The full Docker development stack can also be started with `docker compose up --build -d`. The backend image includes migrations and applies them before starting Uvicorn. To create the administrator inside that backend container, run `docker compose exec backend python -m app.create_admin`. Use one backend runtime at a time to avoid port 8001 conflicts.

## Test with your own data

1. Sign up as a Pharmacist using your own details. The account shows an approval screen.
2. Sign out, sign in with your Admin account and the Admin role, open Settings, and approve the pharmacist. Hospital Staff follows the same approval process.
3. Sign in as the approved Pharmacist or Hospital Staff, open My medicine stock, and choose Add medicine. Enter the actual medicine/generic name, strength, category, institution name/address/phone, coordinates, total stock, and reorder level. Set the institution to Open when appropriate. Save and verify the record appears.
4. Add another medicine: the saved institution details are reused automatically. Use Update stock to change total stock; reserved quantities cannot be overwritten. Use Medicine pickup location to edit your address, coordinates, phone, opening hours, and open/closed status. Changes are visible in subsequent searches.
5. Sign up as a Patient in another browser profile or sign out first. Search for the medicine, enter coordinates or use the browser's location permission, and specify quantity. Search results include matching strengths and only open pharmacies/hospitals with enough unreserved stock.
6. Submit a reservation, then check the patient's Reservations page. In the supplying Pharmacist/Hospital Staff account, confirm it and complete pickup. Available stock decreases when reserved; total stock decreases when pickup is completed.
7. Try requesting more units than available. The API must reject it. Cancel another reservation and confirm its held units are released. Active holds expire after 15 minutes; expiry is processed when inventory/reservation/recommendation data is next read.
8. Restart the backend and sign in again. Your accounts, pharmacy, inventory, reservations, and audit records remain in PostgreSQL.
9. Switch Language to Sinhala on the login page or app header. Test signup, inventory, search, and reservations in both languages. The preference survives refresh; medicine names remain unchanged.
10. Verify a Patient cannot access stock-management/admin endpoints and that another pharmacist or hospital account cannot edit the first institution's stock or confirm its reservations. Test a hospital-to-pharmacy attempt and a hospital-to-hospital attempt.

Sign out before changing accounts. The database volume is persistent; restarting containers does not erase your records.

## Detect location automatically

Every coordinate-entry form has a **Use my location** button: patient/hospital medicine search and emergency requests, first-time pharmacy/hospital inventory registration, and institution pickup-location editing. Click it and allow the browser permission prompt. Coordinates are filled automatically, with an estimated accuracy and a map link for checking the result. Save or search explicitly after reviewing the location.

For an institution, use detection while physically at the pharmacy/hospital. Device location is an estimate and does not automatically fill the street address. Existing coordinates are preserved if permission is denied, the request times out, or detection fails. Manual coordinate entry remains available. Browser geolocation needs `localhost` or HTTPS; a plain HTTP LAN address may not support it.

## Form validation

Forms show errors beside the relevant field in English or Sinhala and focus the first invalid field on submit. Required text cannot contain only spaces. Email format, matching passwords (at least six non-padding characters), field lengths, and optional phone format are checked. Phone numbers accept an optional leading `+`, spaces, parentheses, and hyphens, with 7 to 15 digits.

Stock and reorder levels must be nonnegative whole numbers within PostgreSQL integer limits. Reservation quantity must be a positive whole number. Latitude is limited to -90..90 and longitude to -180..180; both zero and decimal coordinates are valid. The backend independently validates these rules and also rejects stock changes below already-reserved units. Passwords retain their exact characters; names and email addresses are normalized separately.

## Verification

Run from `backend` after migrations, with PostgreSQL running:

```powershell
.\.venv\Scripts\python.exe -m unittest discover -s tests -v
.\.venv\Scripts\python.exe -m compileall -q app
```

The API integration suite uses the configured PostgreSQL database with an outer transaction rolled back after every test. It checks role restrictions, approvals, ownership, password hashing, persisted sessions, reservation transitions, stock release, search, and Unicode data. Test inserts can advance database sequences even though test rows are rolled back.

From `frontend`:

```powershell
npm.cmd test
npm.cmd run build
```

## API overview

| Routes | Access |
| --- | --- |
| `POST /auth/signup`, `POST /auth/login` | Public; no public Admin signup |
| `GET /auth/me`, `POST /auth/logout` | Valid bearer session, including pending accounts |
| `GET /admin/users`, `POST /admin/users/{id}/approve` | Approved Admin |
| `GET/POST /inventory`, `PATCH /inventory/{id}` | Approved Pharmacist/Hospital Staff; own stock only. Admin retains global management |
| `GET /medicines`, `GET /medicines/search` | Approved accounts |
| `GET /pharmacies`, `GET /pharmacies/recommendations` | Approved accounts |
| `GET/PATCH /pharmacies/mine` | Approved Pharmacist/Hospital Staff/Admin; own institution profile only |
| `GET /reservations` | Approved account; scoped by account/pharmacy/role |
| `POST /reservations` | Approved Patient/Hospital Staff; inventory ID and quantity |
| `PATCH /reservations/{id}` | Requester can cancel; supplying institution/Admin can confirm or complete |
| `GET /dashboard/summary` | Approved Pharmacist/Admin |
| `GET /operations/alerts` | Approved Pharmacist/Hospital Staff/Admin |
| `GET /operations/audit-events` | Own events; Admin sees all |

Use the Authorize button in API docs with the token returned by login. Sessions expire after eight hours; logout revokes the current token.

## Current boundaries

Demand forecasting and stock transfer execution are not implemented. Their screens show empty states instead of sample predictions or successful-looking actions. Verified alternatives are empty until a real verification workflow exists. Distance is calculated from coordinates; travel time and stock-based ranking are estimates, not live navigation or trained medical/availability predictions. Opening status is manually maintained by the pharmacy. The system does not prescribe medicines or automatically substitute them.

Batch/expiry tracking, sales-history entry, password recovery, notifications, and pharmacy registration/license verification are future work. Each Pharmacist/Hospital Staff account currently owns one institution (shared multi-staff institution accounts are not implemented); Admin edits global stock but Add medicine registers/uses the Admin's own pharmacy. Sessions are stored in browser local storage; HTTPS and deployment hardening are needed for a public deployment.

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
