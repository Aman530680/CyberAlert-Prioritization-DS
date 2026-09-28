"""
CyberAlert-Prioritization: FastAPI Application Entrypoint
Intelligent SOC Alert Analytics & Incident Prediction Platform API.
"""

import sys
import logging
from pathlib import Path
from contextlib import asynccontextmanager

# Add project root to sys.path so it runs seamlessly from any working directory
PROJECT_ROOT = Path(__file__).resolve().parent.parent.parent
if str(PROJECT_ROOT) not in sys.path:
    sys.path.insert(0, str(PROJECT_ROOT))

from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from backend.app.core.config import settings
from backend.app.api.routes import overview, alerts, models, insights, predict
from src.ml.predict import get_predictor

logging.basicConfig(level=logging.INFO, format="%(asctime)s [%(levelname)s] %(name)s: %(message)s")
logger = logging.getLogger("api_main")


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Preload Random Forest model into memory
    logger.info("Starting CyberAlert Backend Service...")
    try:
        get_predictor()
        logger.info("Random Forest inference engine preloaded successfully.")
    except Exception as e:
        logger.warning(f"ML Predictor warm-up notice: {e}")
    yield
    # Shutdown
    logger.info("Shutting down CyberAlert Backend Service...")


app = FastAPI(
    title=settings.PROJECT_NAME,
    version=settings.VERSION,
    description="Intelligent SOC Alert Analytics & Incident Prediction Platform API",
    lifespan=lifespan
)

# CORS Middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGIN_LIST + ["*"], # Allow local Vite frontend
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Global Exception Handler
@app.exception_handler(Exception)
async def global_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error on {request.method} {request.url}: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"detail": "An internal server error occurred.", "error": str(exc)}
    )

# Root Health & Info
@app.get("/health", tags=["Health"])
def health_check():
    return {
        "status": "healthy",
        "service": settings.PROJECT_NAME,
        "version": settings.VERSION,
        "database": "MySQL (cyberalert_db)"
    }

# Include API Routers under /api
app.include_router(overview.router, prefix=settings.API_V1_STR)
app.include_router(alerts.router, prefix=settings.API_V1_STR)
app.include_router(models.router, prefix=settings.API_V1_STR)
app.include_router(insights.router, prefix=settings.API_V1_STR)
app.include_router(predict.router, prefix=settings.API_V1_STR)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("backend.app.main:app", host=settings.API_HOST, port=settings.API_PORT, reload=True)
