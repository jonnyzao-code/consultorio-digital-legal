"""
Tool: clasificar_consulta
Usa Gemini Flash con JSON schema output estructurado para clasificar consultas legales colombianas.
"""

import json
import logging
from typing import Any

import google.genai as genai
from google.genai import types

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# JSON Schema de respuesta
# ---------------------------------------------------------------------------

CLASIFICACION_SCHEMA = {
    "type": "object",
    "properties": {
        "rama": {
            "type": "string",
            "enum": ["penal", "civil", "laboral", "familia", "administrativo", "otro"],
            "description": "Rama del derecho a la que pertenece la consulta.",
        },
        "confianza": {
            "type": "number",
            "minimum": 0.0,
            "maximum": 1.0,
            "description": "Nivel de confianza de la clasificación entre 0 y 1.",
        },
        "descripcion_rama": {
            "type": "string",
            "description": "Explicación breve de por qué pertenece a esa rama.",
        },
        "acciones_recomendadas": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Lista de acciones concretas que el usuario puede tomar.",
        },
        "documentos_sugeridos": {
            "type": "array",
            "items": {"type": "string"},
            "description": "Documentos que el usuario debe reunir para su caso.",
        },
    },
    "required": ["rama", "confianza", "descripcion_rama", "acciones_recomendadas", "documentos_sugeridos"],
}

# ---------------------------------------------------------------------------
# System prompt con few-shot colombianos
# ---------------------------------------------------------------------------

SYSTEM_PROMPT = """Eres un asistente legal especializado en el sistema jurídico colombiano.
Tu función es clasificar consultas legales en una de las siguientes ramas del derecho:

- **penal**: Delitos, denuncias ante la Fiscalía, procesos penales, víctimas, imputados, medidas de aseguramiento.
- **civil**: Contratos entre particulares, deudas, sucesiones, bienes inmuebles, propiedad, responsabilidad civil extracontractual.
- **laboral**: Despidos, prestaciones sociales, acoso laboral, seguridad social, pensiones, accidentes de trabajo.
- **familia**: Divorcio, custodia de hijos, alimentos, adopción, violencia intrafamiliar, unión marital de hecho.
- **administrativo**: Tutelas contra entidades del Estado, derechos de petición, nulidades, contratación estatal, disciplinario.
- **otro**: Si no encaja claramente en ninguna rama anterior.

Responde SIEMPRE en JSON válido siguiendo el schema indicado. No añadas texto fuera del JSON.

### Ejemplos few-shot colombianos:

**Caso 1 - Laboral:**
Consulta: "Me despidieron sin justa causa después de 5 años en la empresa y no me han pagado la liquidación."
{
  "rama": "laboral",
  "confianza": 0.97,
  "descripcion_rama": "Terminación unilateral del contrato de trabajo sin justa causa y no pago de prestaciones sociales.",
  "acciones_recomendadas": [
    "Presentar demanda ordinaria laboral ante el Juez Laboral del Circuito",
    "Radicar queja ante el Ministerio del Trabajo",
    "Solicitar liquidación definitiva por escrito a la empresa"
  ],
  "documentos_sugeridos": [
    "Contrato de trabajo",
    "Últimas colillas de pago",
    "Carta de despido",
    "Cédula de ciudadanía",
    "Certificado de afiliación al sistema de seguridad social"
  ]
}

**Caso 2 - Familia:**
Consulta: "Mi esposo no me pasa dinero para los gastos de mi hijo de 4 años desde hace 3 meses."
{
  "rama": "familia",
  "confianza": 0.98,
  "descripcion_rama": "Cuota alimentaria para menor de edad regulada en el Código de la Infancia y la Adolescencia.",
  "acciones_recomendadas": [
    "Interponer demanda de fijación de cuota alimentaria ante el Juez de Familia",
    "Solicitar medida provisional de alimentos",
    "Presentar denuncia por inasistencia alimentaria ante la Fiscalía"
  ],
  "documentos_sugeridos": [
    "Registro civil de nacimiento del menor",
    "Cédula de ciudadanía",
    "Pruebas de los ingresos del padre",
    "Recibos de gastos escolares y médicos del menor"
  ]
}

**Caso 3 - Penal:**
Consulta: "Fui víctima de estafa por internet, me sacaron 2 millones de pesos con un negocio falso."
{
  "rama": "penal",
  "confianza": 0.96,
  "descripcion_rama": "Configura el delito de estafa (Art. 246 C.P.) o transferencia no consentida de activos.",
  "acciones_recomendadas": [
    "Presentar denuncia ante la Fiscalía General de la Nación",
    "Radicar queja ante el Centro Cibernético Policial",
    "Bloquear las cuentas involucradas"
  ],
  "documentos_sugeridos": [
    "Capturas de pantalla de las conversaciones",
    "Comprobantes de transferencia",
    "Datos del estafador",
    "Cédula de ciudadanía"
  ]
}

**Caso 4 - Administrativo:**
Consulta: "Llevo 6 meses esperando respuesta de la EPS a mi solicitud de cirugía."
{
  "rama": "administrativo",
  "confianza": 0.93,
  "descripcion_rama": "Vulneración del derecho a la salud por omisión de entidad del sistema de salud, susceptible de tutela.",
  "acciones_recomendadas": [
    "Interponer acción de tutela por vulneración del derecho fundamental a la salud",
    "Radicar derecho de petición formal ante la EPS",
    "Presentar queja ante la Superintendencia Nacional de Salud"
  ],
  "documentos_sugeridos": [
    "Historia clínica completa",
    "Orden médica de la cirugía",
    "Radicados de solicitudes previas a la EPS",
    "Cédula de ciudadanía",
    "Carné de afiliación a la EPS"
  ]
}
"""


# ---------------------------------------------------------------------------
# Función principal
# ---------------------------------------------------------------------------

async def clasificar_consulta(texto: str, api_key: str) -> dict[str, Any]:
    """
    Clasifica una consulta legal colombiana usando Gemini Flash con JSON schema.

    Args:
        texto: Descripción del problema legal en lenguaje natural.
        api_key: API key de Google Gemini.

    Returns:
        Diccionario con: rama, confianza, descripcion, acciones_recomendadas, documentos_sugeridos.
    """
    client = genai.Client(api_key=api_key)

    prompt_usuario = f"Clasifica la siguiente consulta legal colombiana:\n\n{texto}"

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt_usuario,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            response_mime_type="application/json",
            response_schema=CLASIFICACION_SCHEMA,
            temperature=0.1,
            max_output_tokens=1024,
        ),
    )

    raw_text = response.text
    logger.debug("Respuesta raw de Gemini: %s", raw_text)

    datos = json.loads(raw_text)

    # Normalizar key descripcion_rama -> descripcion para el schema de la API
    if "descripcion_rama" in datos:
        datos["descripcion"] = datos.pop("descripcion_rama")

    return datos
