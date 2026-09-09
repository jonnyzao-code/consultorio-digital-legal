"""Wrapper del SDK google-genai para clasificación y generación de documentos."""
import json
from typing import Optional
from google import genai
from google.genai import types

from app.config import get_settings

settings = get_settings()


def _get_client() -> genai.Client:
    return genai.Client(api_key=settings.GEMINI_API_KEY)


SYSTEM_PROMPT_CLASIFICADOR = """
Eres un asistente legal experto en derecho colombiano. Tu tarea es clasificar 
consultas legales en una de las siguientes ramas del derecho:

- penal: crímenes, delitos, víctimas, procesos penales, fiscalía
- civil: contratos, deudas, propiedades, sucesiones, responsabilidad civil
- laboral: despidos, salarios, prestaciones, acoso laboral, liquidaciones
- familia: divorcios, custodia, alimentos, adopción, violencia intrafamiliar
- administrativo: entidades públicas, servicios del estado, multas, licencias
- otro: cuando no encaja claramente en ninguna de las anteriores

Responde SOLO con un JSON válido con los campos: 
rama, confianza (0.0-1.0), descripcion_rama, acciones_recomendadas (lista), documentos_sugeridos (lista).
"""

SYSTEM_PROMPT_DOCUMENTOS = """
Eres un abogado colombiano experto en redacción de documentos legales.
Redactas documentos con precisión jurídica, citando correctamente la legislación colombiana.
Usa lenguaje formal y técnico-legal apropiado.
"""


async def clasificar_consulta(texto: str) -> dict:
    """Clasifica una consulta en la rama del derecho colombiano."""
    client = _get_client()

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=f"Clasifica esta consulta legal: {texto}",
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT_CLASIFICADOR,
            response_mime_type="application/json",
            temperature=0.1,
        ),
    )

    try:
        return json.loads(response.text)
    except json.JSONDecodeError:
        return {
            "rama": "otro",
            "confianza": 0.5,
            "descripcion_rama": "No se pudo clasificar automáticamente",
            "acciones_recomendadas": ["Consultar con un abogado"],
            "documentos_sugeridos": [],
        }


async def generar_documento(tipo: str, datos: dict) -> str:
    """Genera el contenido de un documento legal usando Gemini Pro."""
    client = _get_client()

    prompt = f"""
    Genera un {tipo} completo con los siguientes datos:
    {json.dumps(datos, ensure_ascii=False, indent=2)}
    
    Sigue el formato legal colombiano vigente. Incluye todos los campos obligatorios.
    Retorna el documento completo en formato markdown.
    """

    response = client.models.generate_content(
        model="gemini-2.5-pro",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT_DOCUMENTOS,
            temperature=0.2,
        ),
    )
    return response.text


async def chat_orientacion(historial: list[dict], mensaje: str) -> str:
    """Chatbot de orientación legal inicial con historial."""
    client = _get_client()

    system = """
    Eres un asistente de orientación legal para ciudadanos colombianos.
    Ayudas a entender sus derechos y orientas sobre qué tipo de ayuda legal necesitan.
    NO das asesoría legal específica ni reemplazas a un abogado.
    Habla en español colombiano, de forma clara y empática.
    """

    contents = []
    for msg in historial:
        contents.append(types.Content(
            role=msg["role"],
            parts=[types.Part(text=msg["content"])]
        ))
    contents.append(types.Content(
        role="user",
        parts=[types.Part(text=mensaje)]
    ))

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=contents,
        config=types.GenerateContentConfig(
            system_instruction=system,
            temperature=0.7,
            max_output_tokens=500,
        ),
    )
    return response.text
