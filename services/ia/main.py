"""Servicio IA — Consultorio Digital Legal (prototipo).

Endpoints:
  GET  /health                         → estado
  POST /classify                       → clasificación por rama del derecho
  POST /documents/tutela               → borrador de acción de tutela
  POST /documents/derecho-peticion     → borrador de derecho de petición
"""
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from classifier import classify_text
from generators import generate_tutela, generate_derecho_peticion

app = FastAPI(title="Consultorio Digital Legal — Servicio IA", version="0.1.0")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_methods=["*"],
    allow_headers=["*"],
)

DISCLAIMER = (
    "Documento generado automáticamente con fines de orientación. "
    "No constituye asesoría jurídica y debe ser revisado y firmado por un "
    "abogado titulado antes de presentarse ante cualquier autoridad."
)

CLASSIFY_DISCLAIMER = (
    "Clasificación automática con fines de orientación. "
    "No constituye asesoría jurídica ni determina la vía procesal definitiva."
)


class ClassifyRequest(BaseModel):
    text: str


class TutelaRequest(BaseModel):
    nombre_accionante: str = ""
    cedula_accionante: str = ""
    direccion_accionante: str = ""
    email_accionante: str = ""
    telefono_accionante: str = ""
    entidad_accionada: str = ""
    derechos: str = ""
    hechos: str = ""
    pretensiones: str = ""
    pruebas: str = ""


class DerechoPeticionRequest(BaseModel):
    nombre: str = ""
    cedula: str = ""
    direccion: str = ""
    email: str = ""
    telefono: str = ""
    ciudad: str = ""
    entidad: str = ""
    tipo: str = ""
    peticion: str = ""
    fundamentos: str = ""


@app.get("/")
def root():
    return {
        "service": "Consultorio Digital Legal — Servicio IA",
        "endpoints": {
            "health": "GET /health",
            "classify": "POST /classify",
            "tutela": "POST /documents/tutela",
            "derecho_peticion": "POST /documents/derecho-peticion",
        },
    }


@app.get("/health")
def health():
    return {"status": "ok", "service": "ia"}


@app.post("/classify")
def classify(req: ClassifyRequest):
    if not req.text.strip():
        raise HTTPException(status_code=400, detail="El texto no puede estar vacío")
    result = classify_text(req.text)
    result["disclaimer"] = CLASSIFY_DISCLAIMER
    return result


@app.post("/documents/tutela")
def tutela(req: TutelaRequest):
    content = generate_tutela(req.model_dump())
    return {"title": "Acción de Tutela", "content": content, "disclaimer": DISCLAIMER}


@app.post("/documents/derecho-peticion")
def derecho_peticion(req: DerechoPeticionRequest):
    content = generate_derecho_peticion(req.model_dump())
    return {
        "title": "Derecho de Petición",
        "content": content,
        "disclaimer": DISCLAIMER,
    }
