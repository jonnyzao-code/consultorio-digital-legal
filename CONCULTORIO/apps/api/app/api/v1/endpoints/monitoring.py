from fastapi import APIRouter
from app.schemas.schemas import ProcessQueryRequest, ProcessQueryResponse
from app.services.scraper_service import JudicialScraperService

router = APIRouter()

@router.post("/query-process", response_model=ProcessQueryResponse, summary="Consultar radicado en Rama Judicial")
async def query_process(req: ProcessQueryRequest):
    return await JudicialScraperService.query_process(req.radicado)

@router.get("/alerts", summary="Consultar alertas de novedades judiciales activas")
async def get_active_alerts():
    return [
        {
            "id": 1,
            "radicado": "11001400301520240012800",
            "tipo": "Novedad en Despacho",
            "mensaje": "Se emitió Auto Admisorio con traslado de 48 horas.",
            "fecha": "Hoy",
            "severidad": "urgente"
        }
    ]
