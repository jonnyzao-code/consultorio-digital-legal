from fastapi import APIRouter
from app.api.v1.endpoints import (
    auth,
    cases,
    collab,
    dashboard,
    documents,
    history,
    monitoring,
    lawyers,
    payments,
)

api_router = APIRouter()

api_router.include_router(auth.router, prefix="/auth", tags=["Autenticación"])
api_router.include_router(history.router, prefix="/history", tags=["Historial del usuario"])
api_router.include_router(dashboard.router, prefix="/dashboard", tags=["Dashboard del usuario"])
api_router.include_router(collab.router, prefix="/lawyers/collab", tags=["Cooperativa de abogados"])
api_router.include_router(cases.router, prefix="/cases", tags=["Casos y Clasificación"])
api_router.include_router(documents.router, prefix="/documents", tags=["Generación de Documentos"])
api_router.include_router(monitoring.router, prefix="/monitoring", tags=["Monitoreo Rama Judicial"])
api_router.include_router(lawyers.router, prefix="/lawyers", tags=["Abogados y Bonificaciones"])
api_router.include_router(payments.router, prefix="/payments", tags=["Pagos y Monetización"])
