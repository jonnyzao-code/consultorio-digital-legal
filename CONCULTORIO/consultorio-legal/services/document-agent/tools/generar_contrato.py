"""
Tool: generar_contrato
Genera contratos legales colombianos: arrendamiento o prestación de servicios.
"""

import logging
from pydantic import BaseModel
from typing import Literal

import google.genai as genai
from google.genai import types

logger = logging.getLogger(__name__)

SYSTEM_PROMPT = """Eres un abogado colombiano experto en derecho contractual. Generas contratos COMPLETOS,
FORMALES y con todas las cláusulas legales requeridas por la legislación colombiana.
Los contratos deben ser equilibrados y proteger los derechos de ambas partes.
Usa el Código Civil colombiano, Ley 820 de 2003 (arrendamiento urbano),
Código Sustantivo del Trabajo (para diferenciarlo del laboral en prestación de servicios).
Formato Markdown con numeración clara de cláusulas."""


class ParteContrato(BaseModel):
    nombre: str
    cedula_o_nit: str
    domicilio: str
    calidad: str  # Arrendador, Arrendatario, Contratante, Contratista


class ContratoArrendamientoData(BaseModel):
    inmueble_direccion: str
    inmueble_descripcion: str
    canon_mensual: int  # En pesos colombianos
    deposito: int | None = None
    duracion_meses: int = 12
    fecha_inicio: str
    uso: Literal["habitacional", "comercial"] = "habitacional"
    incluye_administracion: bool = False
    valor_administracion: int | None = None


class ContratoPrestacionData(BaseModel):
    objeto: str
    honorarios_mensuales: int
    duracion_meses: int
    entregables: list[str]
    lugar_ejecucion: str
    tiene_propiedad_intelectual: bool = True


class ContratoInput(BaseModel):
    tipo: Literal["arrendamiento", "prestacion_servicios"]
    partes: list[ParteContrato]
    ciudad: str = "Bogotá D.C."
    fecha: str | None = None
    datos_arrendamiento: ContratoArrendamientoData | None = None
    datos_prestacion: ContratoPrestacionData | None = None


async def generar_contrato(data: ContratoInput, api_key: str) -> str:
    """
    Genera un contrato legal colombiano completo.

    Returns:
        Texto del contrato en formato Markdown.
    """
    from datetime import date
    fecha = data.fecha or date.today().strftime("%d de %B de %Y")

    partes_texto = "\n".join(
        f"- **{p.calidad}**: {p.nombre}, C.C./NIT {p.cedula_o_nit}, domiciliado en {p.domicilio}"
        for p in data.partes
    )

    if data.tipo == "arrendamiento":
        d = data.datos_arrendamiento
        if not d:
            raise ValueError("Se requieren datos_arrendamiento para contratos de arrendamiento.")

        prompt = f"""Genera un CONTRATO DE ARRENDAMIENTO completo bajo la Ley 820 de 2003 con:

**PARTES:**
{partes_texto}

**INMUEBLE:**
- Dirección: {d.inmueble_direccion}
- Descripción: {d.inmueble_descripcion}
- Uso: {d.uso.upper()}

**CONDICIONES ECONÓMICAS:**
- Cánon mensual: ${d.canon_mensual:,} COP
- Depósito: ${d.deposito:,} COP (si aplica)
- Incluye administración: {"SÍ - $" + f"{d.valor_administracion:,}" if d.incluye_administracion and d.valor_administracion else "NO"}

**DURACIÓN:** {d.duracion_meses} meses a partir del {d.fecha_inicio}

**CIUDAD Y FECHA:** {data.ciudad}, {fecha}

El contrato debe incluir todas estas cláusulas:
1. Identificación de las partes
2. Objeto del contrato
3. Destinación del inmueble
4. Canon de arrendamiento e índice IPC para reajuste (Ley 820/2003 Art. 20)
5. Depósito en garantía
6. Servicios públicos y su responsabilidad
7. Reparaciones locativas (Art. 1985 CC)
8. Subarrendamiento (prohibición o autorización)
9. Obligaciones del arrendador (Art. 1982 CC y Ley 820/2003)
10. Obligaciones del arrendatario (Art. 1996 CC y Ley 820/2003)
11. Causales de terminación (Ley 820/2003 Arts. 22-24)
12. Restitución del inmueble y trámite de lanzamiento
13. Cláusula penal
14. Notificaciones y domicilio contractual
15. Firma de las partes y testigos"""

    else:  # prestacion_servicios
        d = data.datos_prestacion
        if not d:
            raise ValueError("Se requieren datos_prestacion para contratos de prestación de servicios.")

        entregables_lista = "\n".join(f"- {e}" for e in d.entregables)

        prompt = f"""Genera un CONTRATO DE PRESTACIÓN DE SERVICIOS completo con:

**PARTES:**
{partes_texto}

**OBJETO DEL CONTRATO:**
{d.objeto}

**CONDICIONES:**
- Honorarios mensuales: ${d.honorarios_mensuales:,} COP
- Duración: {d.duracion_meses} meses
- Lugar de ejecución: {d.lugar_ejecucion}
- Tiene cláusula de propiedad intelectual: {"SÍ" if d.tiene_propiedad_intelectual else "NO"}

**ENTREGABLES:**
{entregables_lista}

**CIUDAD Y FECHA:** {data.ciudad}, {fecha}

El contrato debe incluir:
1. Identificación de las partes
2. Objeto del contrato (específico y detallado)
3. Obligaciones del contratista
4. Obligaciones del contratante
5. Honorarios y forma de pago
6. Duración y prórroga
7. Independencia laboral (Art. 34 CST - no genera relación laboral)
8. Responsabilidad por afiliación al sistema de seguridad social (Decreto 1703/2002)
9. Entregables y criterios de calidad
10. Propiedad intelectual y confidencialidad
11. Causales de terminación anticipada
12. Cláusula penal por incumplimiento
13. Resolución de conflictos (conciliación antes de proceso judicial)
14. Domicilio contractual y notificaciones
15. Firma de las partes"""

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.15,
            max_output_tokens=5000,
        ),
    )

    return response.text
