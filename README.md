# MediAssure AI

AI-powered emergency medicine availability, predictive stock management, and smart pharmacy rebalancing system.

## Project Overview

MediAssure AI is a final-year research project concept for the healthcare and pharmacy domain. The system helps emergency users find pharmacies where a required medicine is most likely to still be available when they arrive, instead of recommending only the nearest pharmacy.

The core innovation is:

```text
Predict -> Match -> Rebalance
```

The system predicts possible medicine shortages, matches users with the most reliable nearby pharmacy, and recommends stock redistribution between pharmacies before shortages happen.

## How It Works

MediAssure AI has two main parts:

- **Frontend web app**: A React dashboard with role-based user interfaces for patients, pharmacists, hospital staff, and admins.
- **Backend API**: A FastAPI service that provides authentication, pharmacy recommendations, inventory records, reservations, forecasts, alerts, and audit data.

The frontend does not use local mock data for the application flow. After sign in or sign up, it loads project data from the backend API. If the backend is not running, the app shows a backend connection error.

Role-based access is handled in the frontend using the authenticated user's backend role:

| Role | Main UI Access |
| --- | --- |
| Patient | Emergency request, medicine finder, reservations, settings |
| Pharmacist | Dashboard, inventory, forecasts, reservations, rebalancing, network, alerts, settings |
| Hospital Staff | Emergency request, medicine finder, reservations, pharmacy network, alerts, settings |
| Admin | Full operational access |

## Main Features

- Medicine search
- Nearby pharmacy and hospital locator
- Real-time medicine inventory availability
- Emergency medicine request mode
- Pharmacy inventory management
- Low-stock alerts
- Medicine demand forecasting
- Medicine stock-out prediction
- AI-based pharmacy recommendation
- Availability confidence score
- Emergency medicine rescue score
- Predictive inventory management
- Inter-pharmacy stock redistribution recommendations
- Emergency medicine reservations
- Pharmacist-verified generic or alternative medicine information
- Cloud-based inventory synchronization
- CI/CD with DevOps
- ML model deployment and monitoring with MLOps

## Tech Stack

### Current Implementation

| Layer | Technology |
| --- | --- |
| Frontend | React 19, TypeScript, Vite |
| UI Styling | Tailwind CSS |
| Icons | lucide-react |
| Backend | FastAPI, Python |
| API Validation | Pydantic |
| ORM Models | SQLAlchemy |
| Geospatial Model Support | GeoAlchemy2 |
| Database Target | PostgreSQL with PostGIS |
| Map UI | OpenStreetMap embed |
| Dev Runtime | Node.js, npm, Uvicorn |

### Planned / Research Stack

| Layer | Technology |
| --- | --- |
| Mobile | React Native |
| Cache | Redis |
| ML Forecasting | Scikit-learn, XGBoost, LightGBM |
| Rebalancing Optimization | Google OR-Tools |
| Explainability | SHAP |
| Cloud | AWS |
| Containers | Docker |
| Container Registry | Amazon ECR |
| Deployment | AWS ECS Fargate |
| ML Deployment | Amazon SageMaker |
| Storage | Amazon S3 |
| Authentication | AWS Cognito |
| Notifications | Amazon SNS |
| Monitoring | Amazon CloudWatch |
| CI/CD | GitHub Actions |
| Infrastructure | Terraform |
| MLOps | MLflow, SageMaker |

## Running Guide

### Prerequisites

Install these first:

- Python 3.11+
- Node.js 20+
- npm

### 1. Start The Backend

From the project root:

```bash
cd backend
python -m venv .venv
.venv\Scripts\activate
pip install -r requirements.txt
python -m uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Backend URL:

```text
http://localhost:8000
```

API docs:

```text
http://localhost:8000/docs
```

### 2. Start The Frontend

Open a new terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Frontend URL:

```text
http://localhost:5173
```

If port `5173` is already in use, Vite will automatically choose another port such as:

```text
http://localhost:5174
```

### 3. Sign In

Use the auth screen and choose a role:

- Pharmacist
- Hospital Staff
- Patient
- Admin

Default demo password:

```text
demo-password
```

The selected role controls which pages appear in the sidebar.

## API Endpoints

Main backend endpoints:

| Method | Endpoint | Purpose |
| --- | --- | --- |
| GET | `/health` | API health check |
| POST | `/auth/login` | Role-based sign in |
| POST | `/auth/signup` | Create a role-based demo account |
| GET | `/dashboard/summary` | Dashboard metrics |
| GET | `/inventory` | Pharmacy inventory |
| GET | `/medicines` | Medicine list |
| GET | `/medicines/search?query=salbutamol` | Medicine search |
| GET | `/pharmacies` | Pharmacy network data |
| GET | `/pharmacies/recommendations` | Emergency pharmacy recommendations |
| GET | `/reservations` | Medicine reservations |
| POST | `/reservations` | Create reservation |
| GET | `/operations/forecasts` | Demand forecasting data |
| GET | `/operations/transfers` | Stock rebalancing suggestions |
| GET | `/operations/alerts` | Operational alerts |
| GET | `/operations/verified-alternatives` | Pharmacist-verified alternative rules |
| GET | `/operations/audit-events` | Governance audit events |

## Project Structure

```text
MediAssure-AI/
  backend/
    app/
      core/          # Settings and configuration
      models/        # SQLAlchemy database models
      routers/       # FastAPI route handlers
      schemas/       # Pydantic API schemas
      services/      # Shared backend data/services
  frontend/
    src/
      components/    # Shared React UI components
      pages/         # Role-based app pages
      services/      # Backend API client
      roleAccess.tsx # Role-to-page access rules
```

## Verification Commands

Run these before committing:

```bash
cd backend
python -m compileall app
```

```bash
cd frontend
npm run build
```

## Medical Safety Boundary

This system must not independently prescribe medicines or automatically substitute prescription medicines. Generic or alternative medicine information should only be shown when it is pharmacist-verified or doctor-verified.

## Documentation

- [Architecture](docs/architecture.md)
- [Research Scope](docs/research-scope.md)
- [Data Model](docs/data-model.md)
- [Commit Guide](docs/commit-guide.md)
