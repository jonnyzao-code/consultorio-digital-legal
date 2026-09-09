"""
Classifier Agent - Agente clasificador de rama del derecho.
Puerto: 8001
"""

import os
import logging
from contextlib import asynccontextmanager

from dotenv import load_dotenv
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel

from tools.clasificar_consulta import clasificar_consulta
from tools.extraer_datos_ocr import extraer_datos_documento

load_dotenv()

logging.basicConfig(level=logging.INFO, format="%(asctime)s %(levelname)s %(message)s")
logger = logging.getLogger(__name__)

API_KEY = os.getenv("GEMINI_API_KEY", "")


# ---------------------------------------------------------------------------
# Schemas de entrada / salida
# ---------------------------------------------------------------------------

class ConsultaRequest(BaseModel):
    texto: str


class ConsultaResponse(BaseModel):
    rama: str
    confianza: float
    descripcion: str
    acciones_recomendadas: list[str]
    documentos_sugeridos: list[str]


class OCRRequest(BaseModel):
    imagen_base64: str
    tipo_documento: str = "generico"  # cedula, acta, contrato, generico


# ---------------------------------------------------------------------------
# Lifespan
# ---------------------------------------------------------------------------

@asynccontextmanager
async def lifespan(app: FastAPI):
    if not API_KEY:
        logger.warning("GEMINI_API_KEY no configurada. Las llamadas a Gemini fallarán.")
    logger.info("Classifier Agent iniciado en puerto 8001.")
    yield
    logger.info("Classifier Agent detenido.")


# ---------------------------------------------------------------------------
# App FastAPI
# ---------------------------------------------------------------------------

app = FastAPI(
    title="Classifier Agent",
    description="Clasifica consultas legales colombianas por rama del derecho usando Gemini.",
    version="1.0.0",
    lifespan=lifespan,
)


@app.get("/health")
async def health():
    return {"status": "ok", "agent": "classifier", "port": 8001}


@app.post("/clasificar", response_model=ConsultaResponse)
async def clasificar(request: ConsultaRequest):
    """
    Clasifica un texto de consulta legal y retorna la rama del derecho,
    la confianza, descripción y acciones recomendadas.
    """
    if not request.texto.strip():
        raise HTTPException(status_code=400, detail="El campo 'texto' no puede estar vacío.")

    if not API_KEY:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY no configurada en el servidor.")

    logger.info("Clasificando consulta (longitud=%d caracteres)", len(request.texto))

    try:
        resultado = await clasificar_consulta(texto=request.texto, api_key=API_KEY)
        return ConsultaResponse(**resultado)
    except Exception as exc:
        logger.exception("Error al clasificar consulta")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


@app.post("/extraer-documento")
async def extraer_documento(request: OCRRequest):
    """
    Extrae datos estructurados de un documento legal a partir de una imagen en base64.
    """
    if not request.imagen_base64.strip():
        raise HTTPException(status_code=400, detail="El campo 'imagen_base64' no puede estar vacío.")

    if not API_KEY:
        raise HTTPException(status_code=503, detail="GEMINI_API_KEY no configurada en el servidor.")

    logger.info("Extrayendo datos de documento tipo='%s'", request.tipo_documento)

    try:
        datos = await extraer_datos_documento(
            imagen_base64=request.imagen_base64,
            api_key=API_KEY,
            tipo_documento=request.tipo_documento,
        )
        return datos
    except Exception as exc:
        logger.exception("Error al extraer datos del documento")
        raise HTTPException(status_code=500, detail=str(exc)) from exc


# ---------------------------------------------------------------------------
# Entrypoint
# ---------------------------------------------------------------------------

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("agent:app", host="0.0.0.0", port=8001, reload=False)
