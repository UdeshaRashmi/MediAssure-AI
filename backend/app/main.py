from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.routers import health, medicines, pharmacies


app = FastAPI(
    title="MediAssure AI API",
    description="Emergency medicine availability and pharmacy recommendation API.",
    version="0.1.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/health", tags=["health"])
app.include_router(medicines.router, prefix="/medicines", tags=["medicines"])
app.include_router(pharmacies.router, prefix="/pharmacies", tags=["pharmacies"])


@app.get("/")
def root() -> dict[str, str]:
    return {"message": "MediAssure AI API"}

