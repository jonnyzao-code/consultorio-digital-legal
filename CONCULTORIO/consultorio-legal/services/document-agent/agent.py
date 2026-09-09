"""
Document Agent - Generador de documentos legales colombianos.
Puerto: 8002
"""

import os
import base64
import logging
from contextlib import asynccontextmanager
from datetime import date

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from tools.generar_tutela import generar_tutela, TutelaInput
from tools.generar_derecho_peticion import generar_derecho_peticion, DerechoPeticionInput
from tools.generar_contrato import generar_contrato, ContratoInput
from tools.calcular_alimentos import calcular_cuota_alimentaria, AlimentosInput

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

API_KEY = os.getenv("GEMINI_API_KEY", "")


# ---------------------------------------------------------------------------
# Schemas adicionales de respuesta
# ---------------------------------------------------------------------------

class DocumentoResponse(BaseModel):
    documento_markdown: str
    documento_base64: str
    tipo: str
    generado_en: str


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not API_KEY:
        logger.warning("GEMINI_API_KEY no configurada.")
    logger.info("Document Agent iniciado en puerto 8002.")
    yield
    logger.info("Document Agent detenido.")


# ---------------------------------------------------------------------------
# App FastAPI
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Document Agent",
    description="Genera documentos legales colombianos (tutelas, derechos de petición, contratos, alimentos).",
    version="1.0.0",
    lifespan=lifespan,
)


def _validar_api_key():
    if not API_KEY:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY no configurada en el servidor.")


def _to_response(texto: str, tipo: str) -> DocumentoResponse:
    return DocumentoResponse(
        documento_markdown=texto,
        documento_base64=base64.b64encode(texto.encode()).decode(),
        tipo=tipo,
        generado_en=date.today().isoformat(),
    )


@app.get("/health")
async def health():
    return {"status": "ok", "agent": "document", "port": 8002}


# ── Tutela ──────────────────────────────────────────────────────────────────

@app.post("/generar-tutela", response_model=DocumentoResponse)
async def endpoint_tutela(data: TutelaInput):
    """Genera una acción de tutela completa en formato legal colombiano."""
    _validar_api_key()
    try:
        texto = await generar_tutela(data, api_key=API_KEY)
        return _to_response(texto, "tutela")
    except Exception as exc:
        logger.exception("Error generando tutela")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── Derecho de Petición ─────────────────────────────────────────────────────

@app.post("/generar-derecho-peticion", response_model=DocumentoResponse)
async def endpoint_derecho_peticion(data: DerechoPeticionInput):
    """Genera un derecho de petición (Art. 23 CP, Ley 1755/2015)."""
    _validar_api_key()
    try:
        texto = await generar_derecho_peticion(data, api_key=API_KEY)
        return _to_response(texto, "derecho_peticion")
    except Exception as exc:
        logger.exception("Error generando derecho de petición")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── Contrato ────────────────────────────────────────────────────────────────

@app.post("/generar-contrato", response_model=DocumentoResponse)
async def endpoint_contrato(data: ContratoInput):
    """Genera contratos: arrendamiento o prestacion_servicios."""
    _validar_api_key()
    if data.tipo not in ("arrendamiento", "prestacion_servicios"):
        raise HTTPException(
            status_code=400,
            detail="El campo 'tipo' debe ser 'arrendamiento' o 'prestacion_servicios'.",
        )
    try:
        texto = await generar_contrato(data, api_key=API_KEY)
        return _to_response(texto, f"contrato_{data.tipo}")
    except Exception as exc:
        logger.exception("Error generando contrato")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ── Cuota Alimentaria ───────────────────────────────────────────────────────

@app.post("/calcular-alimentos")
async def endpoint_alimentos(data: AlimentosInput):
    """Calcula cuota de alimentos y genera documento con fundamento legal."""
    _validar_api_key()
    try:
        resultado = await calcular_cuota_alimentaria(data, api_key=API_KEY)
        return resultado
    except Exception as exc:
        logger.exception("Error calculando cuota alimentaria")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("agent:app", host="0.0.0.0", port=8002, reload=False)
