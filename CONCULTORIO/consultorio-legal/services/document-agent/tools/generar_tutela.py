"""
Tool: generar_tutela
Genera una acción de tutela completa con formato legal colombiano usando Gemini.
"""

import logging
from pydantic import BaseModel

import google.genai as genai
from google.genai import types

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Eres un abogado colombiano experto en acciones de tutela (Art. 86 de la Constitución Política
y Decreto 2591 de 1991). Generas documentos legales COMPLETOS, FORMALES y CORRECTOS jurídicamente.
El documento debe estar en español formal colombiano, en formato Markdown estructurado.
Usa numeración correcta de artículos, incluye los fundamentos de derecho pertinentes
y sigue el formato estándar de tutelas en Colombia."""


class TutelaInput(BaseModel):
    nombre_accionante: str
    cedula: str
    entidad_accionada: str
    derecho_vulnerado: str
    hechos: list[str]
    pretensiones: list[str]
    ciudad: str = "Bogotá D.C."
    fecha: str | None = None


async def generar_tutela(data: TutelaInput, api_key: str) -> str:
    """
    Genera el texto completo de una acción de tutela.

    Returns:
        Texto de la tutela en formato Markdown.
    """
    from datetime import date
    fecha = data.fecha or date.today().strftime("%d de %B de %Y")

    hechos_numerados = "\n".join(f"{i+1}. {h}" for i, h in enumerate(data.hechos))
    pretensiones_numeradas = "\n".join(f"{i+1}. {p}" for i, p in enumerate(data.pretensiones))

    prompt = f"""Genera una ACCIÓN DE TUTELA completa con los siguientes datos:

**DATOS DEL ACCIONANTE:**
- Nombre completo: {data.nombre_accionante}
- Cédula de ciudadanía: {data.cedula}
- Ciudad: {data.ciudad}

**ENTIDAD ACCIONADA:** {data.entidad_accionada}

**DERECHO FUNDAMENTAL VULNERADO:** {data.derecho_vulnerado}

**HECHOS:**
{hechos_numerados}

**PRETENSIONES:**
{pretensiones_numeradas}

**FECHA:** {fecha}

El documento debe incluir:
1. Encabezado al Despacho del Juez competente
2. Identificación del accionante (nombre, cédula, ciudad, dirección de notificación)
3. Identificación del accionado
4. Hechos numerados y detallados
5. Derechos fundamentales vulnerados
6. Pretensiones
7. Fundamentos de derecho: Art. 86 CP, Decreto 2591 de 1991, jurisprudencia relevante de la Corte Constitucional
8. Pruebas que se aportan
9. Competencia del juez
10. Notificaciones
11. Juramento
12. Firma y datos del accionante

Usa formato Markdown con encabezados claros. El documento debe ser formalmente correcto para presentar ante cualquier despacho judicial colombiano."""

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
            max_output_tokens=4096,
        ),
    )

    return response.text
