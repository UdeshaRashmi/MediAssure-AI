# Architecture

## High-Level System Flow

```text
React / React Native App
        |
        v
API Gateway
        |
        v
FastAPI Backend on AWS ECS Fargate
        |
        +--> Amazon RDS PostgreSQL + PostGIS
        +--> Amazon S3
        +--> SageMaker / MLflow
        +--> Amazon SNS
        +--> CloudWatch
```

## Backend Responsibilities

- User, pharmacist, hospital staff, and admin APIs
- Medicine search
- Pharmacy location search
- Inventory updates
- Reservation handling
- Emergency request handling
- Availability confidence scoring
- Rescue score calculation
- ML prediction service integration
- Stock redistribution recommendation APIs

## Machine Learning Components

### Demand Forecasting

Predicts expected medicine demand for the next 6, 12, and 24 hours.

Candidate algorithms:

- XGBoost
- LightGBM
- Random Forest
- Time-series baselines for comparison

### Availability-on-Arrival Prediction

Predicts:

```text
P(medicine is still available when the user arrives)
```

Candidate algorithms:

- XGBoost
- LightGBM
- Random Survival Forest
- Logistic regression baseline

### Stock Rebalancing

Recommends stock transfers from pharmacies with predicted surplus to pharmacies with predicted shortage.

Candidate approach:

- Google OR-Tools optimization model

## Emergency Rescue Score

The rescue score may combine:

- Current stock
- Predicted availability
- User travel time
- Distance
- Medicine urgency level
- Pharmacy opening status
- Stock update freshness
- Historical demand
- Current sales velocity
- Required quantity
- Stock-out probability

## AWS Services

| Requirement | AWS Service |
| --- | --- |
| Backend hosting | ECS Fargate |
| Docker images | ECR |
| Database | RDS PostgreSQL |
| Files and datasets | S3 |
| ML training/deployment | SageMaker |
| API entry | API Gateway |
| Notifications | SNS |
| Monitoring/logs | CloudWatch |
| Secrets | Secrets Manager |
| Maps/location | Amazon Location Service |

