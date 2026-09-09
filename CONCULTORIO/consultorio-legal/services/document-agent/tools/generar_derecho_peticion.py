"""
Tool: generar_derecho_peticion
Genera un derecho de petición completo (Art. 23 CP, Ley 1755/2015).
"""

import logging
from pydantic import BaseModel
from typing import Literal

import google.genai as genai
from google.genai import types

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Eres un abogado colombiano experto en derechos de petición (Art. 23 de la Constitución
Política y Ley 1755 de 2015). Generas documentos COMPLETOS, FORMALES y CORRECTOS jurídicamente.
El documento debe estar en español formal colombiano, en formato Markdown.
Diferencias el formato correcto según se dirija a entidad pública o privada.
Recuerda que las entidades públicas tienen 15 días hábiles para responder (30 para información)
y las privadas que prestan servicios públicos tienen los mismos términos."""


class DerechoPeticionInput(BaseModel):
    nombre_peticionario: str
    cedula: str
    direccion: str
    ciudad: str
    correo: str | None = None
    telefono: str | None = None
    entidad_destinataria: str
    tipo_entidad: Literal["publica", "privada"] = "publica"
    cargo_destinatario: str = "Representante Legal"
    objeto_peticion: str
    hechos: list[str]
    peticion_concreta: str
    fecha: str | None = None


async def generar_derecho_peticion(data: DerechoPeticionInput, api_key: str) -> str:
    """
    Genera un derecho de petición completo.

    Returns:
        Texto del derecho de petición en formato Markdown.
    """
    from datetime import date
    fecha = data.fecha or date.today().strftime("%d de %B de %Y")

    hechos_numerados = "\n".join(f"{i+1}. {h}" for i, h in enumerate(data.hechos))

    termino = "15 días hábiles" if data.tipo_entidad == "publica" else "30 días hábiles"
    norma_adicional = (
        "Ley 1755 de 2015, Art. 23 Constitución Política de Colombia"
        if data.tipo_entidad == "publica"
        else "Ley 1755 de 2015, Art. 23 CP aplicable a privados que prestan servicios públicos"
    )

    prompt = f"""Genera un DERECHO DE PETICIÓN completo con los siguientes datos:

**DATOS DEL PETICIONARIO:**
- Nombre completo: {data.nombre_peticionario}
- Cédula de ciudadanía: {data.cedula}
- Dirección: {data.direccion}
- Ciudad: {data.ciudad}
- Correo electrónico: {data.correo or "No indicado"}
- Teléfono: {data.telefono or "No indicado"}

**DESTINATARIO:**
- Entidad: {data.entidad_destinataria}
- Cargo: {data.cargo_destinatario}
- Tipo de entidad: {data.tipo_entidad.upper()} (término de respuesta: {termino})

**OBJETO DE LA PETICIÓN:** {data.objeto_peticion}

**HECHOS:**
{hechos_numerados}

**PETICIÓN CONCRETA:** {data.peticion_concreta}

**FECHA:** {fecha}

El documento debe incluir:
1. Ciudad y fecha
2. Datos completos del destinatario y la entidad
3. Identificación del peticionario
4. Objeto claro de la petición
5. Hechos que motivan la petición (numerados)
6. Petición concreta y específica
7. Fundamentos de derecho: {norma_adicional}
8. Advertencia sobre el término de respuesta ({termino})
9. Datos de notificación del peticionario
10. Firma

El tono debe ser respetuoso pero firme. Usa formato Markdown con encabezados."""

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.2,
            max_output_tokens=3000,
        ),
    )

    return response.text
