# Commit Guide

## Recommended Commit Order

1. Initial project documentation and architecture
2. Frontend setup with React, TypeScript, and Tailwind CSS
3. Backend setup with FastAPI
4. Database schema with PostgreSQL and PostGIS
5. Authentication and role-based access control
6. Medicine search and pharmacy locator APIs
7. Pharmacy inventory management
8. Emergency request and reservation workflow
9. Demand forecasting ML pipeline
10. Availability-on-arrival prediction model
11. Emergency rescue score implementation
12. Stock rebalancing optimizer
13. Docker setup
14. GitHub Actions CI pipeline
15. AWS deployment configuration
16. MLOps tracking with MLflow

## Current Changes: Commit One Group at a Time

Run from the repository root. Review `git diff` before staging. These commands are reminders; the app does not create commits.

### 1. Persistent backend, authorization, and database setup

After backend integration tests pass:

```powershell
git add backend docker-compose.yml
git commit -m "Persist accounts and stock with role based API access"
```

This includes the previous backend fixes, password/session handling, staff approval, ownership checks, real inventory/reservations, migrations, and tests.

### 2. Real-data interfaces and Sinhala support

After `npm.cmd run build` passes and the manual workflow has been reviewed:

```powershell
git add frontend/src
git commit -m "Connect role based interfaces and add Sinhala support"
```

### 3. Running and testing documentation

```powershell
git add README.md docs/commit-guide.md
git commit -m "Document real data testing and account approval setup"
```

After every commit, check `git status --short` to see what remains. Do not stage real records, local environments, or database exports.

## Good Commit Message Examples

```bash
git commit -m "Setup React TypeScript frontend"
git commit -m "Setup FastAPI backend structure"
git commit -m "Add PostgreSQL pharmacy inventory schema"
git commit -m "Implement medicine search API"
git commit -m "Add availability prediction training pipeline"
git commit -m "Implement emergency pharmacy ranking score"
git commit -m "Add stock rebalancing optimizer"
```

## Do Not Commit

- `.env` files
- AWS access keys
- API keys
- database passwords
- real patient data
- private pharmacy inventory datasets
- generated model artifacts larger than the repository policy allows
