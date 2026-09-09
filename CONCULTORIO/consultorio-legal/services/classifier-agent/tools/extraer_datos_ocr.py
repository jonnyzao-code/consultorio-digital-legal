"""
Tool: extraer_datos_ocr
Usa Gemini Vision para extraer datos estructurados de documentos legales colombianos.
"""

import base64
import json
import logging
from typing import Any

import google.genai as genai
from google.genai import types

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Schemas JSON por tipo de documento
# ---------------------------------------------------------------------------

SCHEMAS: dict[str, dict] = {
    "cedula": {
        "type": "object",
        "properties": {
            "numero_cedula": {"type": "string"},
            "nombres": {"type": "string"},
            "apellidos": {"type": "string"},
            "fecha_expedicion": {"type": "string"},
            "lugar_expedicion": {"type": "string"},
            "fecha_nacimiento": {"type": "string"},
            "sexo": {"type": "string"},
            "grupo_sanguineo": {"type": "string"},
            "rh": {"type": "string"},
        },
        "required": ["numero_cedula", "nombres", "apellidos"],
    },
    "acta": {
        "type": "object",
        "properties": {
            "tipo_acta": {"type": "string", "description": "nacimiento, matrimonio, defuncion, etc."},
            "numero_acta": {"type": "string"},
            "fecha": {"type": "string"},
            "notaria_o_registro": {"type": "string"},
            "municipio": {"type": "string"},
            "departamento": {"type": "string"},
            "personas_involucradas": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "nombre": {"type": "string"},
                        "cedula": {"type": "string"},
                        "rol": {"type": "string"},
                    },
                },
            },
            "observaciones": {"type": "string"},
        },
        "required": ["tipo_acta", "fecha"],
    },
    "contrato": {
        "type": "object",
        "properties": {
            "tipo_contrato": {"type": "string"},
            "fecha_suscripcion": {"type": "string"},
            "partes": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "nombre": {"type": "string"},
                        "cedula_o_nit": {"type": "string"},
                        "rol": {"type": "string"},
                        "domicilio": {"type": "string"},
                    },
                },
            },
            "objeto": {"type": "string"},
            "valor": {"type": "string"},
            "duracion": {"type": "string"},
            "clausulas_principales": {
                "type": "array",
                "items": {"type": "string"},
            },
            "ciudad_suscripcion": {"type": "string"},
        },
        "required": ["tipo_contrato", "partes", "objeto"],
    },
    "generico": {
        "type": "object",
        "properties": {
            "tipo_documento": {"type": "string"},
            "fecha": {"type": "string"},
            "emisor": {"type": "string"},
            "destinatario": {"type": "string"},
            "numero_radicado": {"type": "string"},
            "resumen": {"type": "string"},
            "datos_clave": {
                "type": "array",
                "items": {
                    "type": "object",
                    "properties": {
                        "campo": {"type": "string"},
                        "valor": {"type": "string"},
                    },
                },
            },
        },
        "required": ["tipo_documento", "resumen"],
    },
}

SYSTEM_PROMPT = """Eres un experto en reconocimiento y extracción de datos de documentos legales colombianos.
Analiza la imagen del documento proporcionado y extrae TODOS los datos visibles con precisión.
Si un campo no es visible o no aplica, omítelo del JSON.
Responde ÚNICAMENTE con JSON válido, sin texto adicional."""


async def extraer_datos_documento(
    imagen_base64: str,
    api_key: str,
    tipo_documento: str = "generico",
) -> dict[str, Any]:
    """
    Extrae datos estructurados de un documento legal a partir de una imagen en base64.

    Args:
        imagen_base64: Imagen codificada en base64 (JPEG o PNG).
        api_key: API key de Google Gemini.
        tipo_documento: Tipo de documento: cedula, acta, contrato, generico.

    Returns:
        Diccionario con los datos extraídos según el tipo de documento.
    """
    schema = SCHEMAS.get(tipo_documento, SCHEMAS["generico"])

    # Detectar mime type por header de la imagen
    try:
        header_bytes = base64.b64decode(imagen_base64[:16])
        mime_type = "image/png" if header_bytes[:4] == b"\x89PNG" else "image/jpeg"
    except Exception:
        mime_type = "image/jpeg"

    client = genai.Client(api_key=api_key)

    image_part = types.Part.from_bytes(
        data=base64.b64decode(imagen_base64),
        mime_type=mime_type,
    )

    prompt = (
        f"Extrae todos los datos del siguiente documento de tipo '{tipo_documento}'. "
        "Retorna SOLO JSON válido con los campos que puedas leer claramente."
    )

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=[image_part, prompt],
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=schema,
            temperature=0.0,
            max_output_tokens=2048,
        ),
    )

    datos = json.loads(response.text)
    datos["tipo_documento_procesado"] = tipo_documento
    datos["mime_detectado"] = mime_type

    return datos
