"""
Consultorio Digital Legal — FastAPI Entry Point
"""
from contextlib import asynccontextmanager
import structlog

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.middleware.trustedhost import TrustedHostMiddleware

from app.core.config import settings
from app.core.database import init_db
from app.api.v1.router import api_router

log = structlog.get_logger()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicialización y limpieza de la aplicación."""
    log.info("🚀 Iniciando Consultorio Digital Legal API", env=settings.ENVIRONMENT)
    await init_db()
    yield
    log.info("🛑 Cerrando API")


app = FastAPI(
    title="Consultorio Digital Legal API",
    description="API del sistema de consultoría legal digital para Colombia",
    version="0.1.0",
    docs_url="/docs" if settings.ENVIRONMENT != "production" else None,
    redoc_url="/redoc" if settings.ENVIRONMENT != "production" else None,
    lifespan=lifespan,
)

# ---- Middlewares ----
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.CORS_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ---- Rutas ----
import os
from fastapi.responses import FileResponse
from fastapi.staticfiles import StaticFiles

app.include_router(api_router, prefix="/api/v1")

web_dir = os.path.abspath(os.path.join(os.path.dirname(__file__), "../..", "apps/web"))

@app.get("/", tags=["Frontend"])
async def serve_frontend():
    index_path = os.path.join(web_dir, "index.html")
    if os.path.exists(index_path):
        return FileResponse(index_path)
    return {"message": "Consultorio Digital Legal API funcionando. Documentación en /docs"}


@app.get("/health", tags=["Health"])
async def health_check():
    return {
        "status": "ok",
        "service": "Consultorio Digital Legal API",
        "version": "0.1.0",
        "environment": settings.ENVIRONMENT,
    }
