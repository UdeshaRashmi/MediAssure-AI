# MediAssure AI

AI-powered emergency medicine availability, predictive stock management, and smart pharmacy rebalancing system.

## Project Overview

MediAssure AI is a final-year research project concept for the healthcare and pharmacy domain. The system helps emergency users find pharmacies where a required medicine is most likely to still be available when they arrive, instead of recommending only the nearest pharmacy.

The core innovation is:

```text
Predict -> Match -> Rebalance
```

The system predicts possible medicine shortages, matches users with the most reliable nearby pharmacy, and recommends stock redistribution between pharmacies before shortages happen.

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

## Recommended Stack

| Layer | Technology |
| --- | --- |
| Web Frontend | React, TypeScript |
| Mobile | React Native |
| UI | Tailwind CSS |
| Backend | FastAPI, Python |
| Database | PostgreSQL, PostGIS |
| Cache | Redis |
| ML | Scikit-learn, XGBoost, LightGBM |
| Optimization | Google OR-Tools |
| Explainability | SHAP |
| Maps | Amazon Location Service or Google Maps API |
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

## Medical Safety Boundary

This system must not independently prescribe medicines or automatically substitute prescription medicines. Generic or alternative medicine information should only be shown when it is pharmacist-verified or doctor-verified.

## Documentation

- [Architecture](docs/architecture.md)
- [Research Scope](docs/research-scope.md)
- [Data Model](docs/data-model.md)
- [Commit Guide](docs/commit-guide.md)

