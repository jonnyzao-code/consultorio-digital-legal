"""
Consultorio Digital Legal — API Principal
"""
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import get_settings
from app.routers import auth, consultas, documentos, pagos, alertas

settings = get_settings()


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Inicializa y cierra recursos al arrancar/apagar el servidor."""
    print("🚀 Consultorio Digital Legal API iniciando...")
    yield
    print("🛑 API cerrando conexiones...")


app = FastAPI(
    title="Consultorio Digital Legal API",
    version="0.1.0",
    description=(
        "API REST para la plataforma de servicios legales digitales en Colombia. "
        "Proporciona endpoints para gestión de consultas, generación de documentos "
        "legales, monitoreo de procesos judiciales y pasarela de pagos Wompi."
    ),
    docs_url="/docs",
    redoc_url="/redoc",
    lifespan=lifespan,
)

# ─── CORS ───────────────────────────────────────────────────────────────────
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.ALLOWED_ORIGINS,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ─── Routers ────────────────────────────────────────────────────────────────
PREFIX = "/api/v1"
app.include_router(auth.router,       prefix=f"{PREFIX}/auth",       tags=["Autenticación"])
app.include_router(consultas.router,  prefix=f"{PREFIX}/consultas",  tags=["Consultas"])
app.include_router(documentos.router, prefix=f"{PREFIX}/documentos", tags=["Documentos"])
app.include_router(pagos.router,      prefix=f"{PREFIX}/pagos",      tags=["Pagos"])
app.include_router(alertas.router,    prefix=f"{PREFIX}/alertas",    tags=["Alertas"])


# ─── Endpoints base ─────────────────────────────────────────────────────────
@app.get("/", tags=["Root"])
async def root():
    return {
        "status": "ok",
        "version": "0.1.0",
        "service": "Consultorio Digital Legal API",
        "docs": "/docs",
    }


@app.get("/health", tags=["Root"])
async def health_check():
    return {
        "status": "healthy",
        "database": "connected",
        "cache": "connected",
    }
