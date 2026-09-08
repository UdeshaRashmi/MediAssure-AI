from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.core.config import get_settings
from app.routers import auth, dashboard, health, inventory, medicines, operations, pharmacies, reservations


settings = get_settings()


app = FastAPI(
    title="MediAssure AI API",
    description="Emergency medicine availability and pharmacy recommendation API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.allowed_origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(auth.router, prefix="/auth", tags=["auth"])
app.include_router(dashboard.router, prefix="/dashboard", tags=["dashboard"])
app.include_router(inventory.router, prefix="/inventory", tags=["inventory"])
app.include_router(medicines.router, prefix="/medicines", tags=["medicines"])
app.include_router(operations.router, prefix="/operations", tags=["operations"])
app.include_router(pharmacies.router, prefix="/pharmacies", tags=["pharmacies"])
app.include_router(reservations.router, prefix="/reservations", tags=["reservations"])


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "MediAssure AI API", "environment": settings.app_env}
