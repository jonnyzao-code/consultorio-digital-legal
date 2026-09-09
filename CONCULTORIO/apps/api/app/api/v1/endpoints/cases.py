from fastapi import APIRouter, HTTPException, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from app.schemas.schemas import (
    CaseClassificationRequest, CaseClassificationResponse,
    LegalCaseCreate, LegalCaseOut, MultiBranchInvestigationResponse
)
from app.agents.classifier_agent import LegalClassifierAgent
from app.services.multi_branch_investigator import MultiBranchLegalInvestigator
from app.core.database import get_db
from app.models.entities import LegalCase, CaseStatus

from app.core.config import settings
from app.services.gemini_service import GeminiAIService

router = APIRouter()

@router.get("/gemini-status", summary="Verificar estado de la conexión con Gemini AI")
async def get_gemini_status():
    """Retorna si la API Key de Gemini está configurada y el modelo activo."""
    has_key = bool(settings.GEMINI_API_KEY)
    masked_key = f"{settings.GEMINI_API_KEY[:6]}...{settings.GEMINI_API_KEY[-4:]}" if has_key else "No configurada"
    return {
        "status": "connected" if has_key else "missing_key",
        "api_key_configured": has_key,
        "masked_key": masked_key,
        "model": settings.GEMINI_MODEL,
        "provider": "Google AI (Gemini)"
    }

@router.post("/classify", response_model=CaseClassificationResponse, summary="Clasificar caso con IA por rama del derecho")
async def classify_legal_issue(req: CaseClassificationRequest):
    """
    Analiza la descripción del problema ciudadano y determina:
    - Rama del derecho (Penal, Laboral, Familia, Civil, Administrativo)
    - Grado de urgencia
    - Derechos fundamentales comprometidos
    - Acción jurídica sugerida
    """
    return LegalClassifierAgent.classify_case(req.description, req.user_context)

@router.post("/investigate-multibranch", response_model=MultiBranchInvestigationResponse, summary="Investigación dogmática multirrama exhaustiva de un caso")
async def investigate_multibranch(req: CaseClassificationRequest):
    """
    Realiza una investigación dogmática y cruzada exhaustiva entre las 6 ramas
    del Derecho Colombiano (Constitucional, Civil/Comercial, Laboral, Penal,
    Administrativo/Superintendencias y Familia), determinando viabilidad, concurrencia
    de acciones y ruta estratégica procesal.
    """
    return MultiBranchLegalInvestigator.investigate_case(req.description)

@router.post("/", response_model=LegalCaseOut, summary="Crear nuevo caso legal")
async def create_case(case_in: LegalCaseCreate, db: AsyncSession = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    case = LegalCase(
        title=case_in.title,
        description=case_in.description,
        branch=case_in.branch,
        status=CaseStatus.PENDING,
        client_id=1,  # TODO: usuario autenticado (auth por implementar en esta capa)
        radicado_number=case_in.radicado_number,
        court_city=case_in.court_city,
    )
    db.add(case)
    await db.flush()
    await db.refresh(case)
    return case

@router.get("/", summary="Listar casos registrados")
async def list_cases(db: AsyncSession = Depends(get_db)):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    result = await db.execute(
        select(LegalCase).order_by(LegalCase.created_at.desc()).limit(100)
    )
    return result.scalars().all()
