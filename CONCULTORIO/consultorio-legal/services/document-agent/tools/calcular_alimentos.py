"""
Tool: calcular_alimentos
Calcula cuota alimentaria según jurisprudencia colombiana y tabla ICBF.
"""

import logging
from pydantic import BaseModel
from typing import Any

import google.genai as genai
from google.genai import types

logger = logging.getLogger(__name__)

SMMLV_2024 = 1_300_000  # Salario mínimo 2024 en Colombia (COP)

SYSTEM_PROMPT = """Eres un abogado colombiano especialista en derecho de familia y cuotas alimentarias.
Conoces la jurisprudencia de la Corte Suprema de Justicia (Sala de Casación Civil), el Código de la
Infancia y la Adolescencia (Ley 1098/2006) y las tablas del ICBF para cuotas alimentarias.
Cuando calculas cuotas alimentarias consideras:
- Mínimo el 30% de los ingresos netos del alimentante (según CSJ)
- Necesidades concretas del menor: alimentación, educación, salud, recreación, vestuario, vivienda
- Principio de proporcionalidad entre capacidad del alimentante y necesidades del beneficiario
- Los alimentos son imprescriptibles e irrenunciables para menores de edad
Responde en español formal colombiano."""


class AlimentosInput(BaseModel):
    ingresos_alimentante: int          # Ingresos mensuales del que debe pagar (COP)
    ingresos_alimentado: int = 0       # Ingresos del que cuida (COP), 0 si no trabaja
    num_hijos: int = 1
    edades_hijos: list[int]            # Lista de edades de los hijos
    gastos_educacion: int = 0          # Gasto mensual en educación (COP)
    gastos_salud: int = 0              # Gasto mensual en salud (COP)
    gastos_vivienda: int = 0           # Canon de arriendo del hogar del menor (COP)
    nombre_alimentante: str = "el alimentante"
    nombre_beneficiario: str = "el menor"
    ciudad: str = "Bogotá D.C."


async def calcular_cuota_alimentaria(data: AlimentosInput, api_key: str) -> dict[str, Any]:
    """
    Calcula la cuota alimentaria y genera documento con fundamento legal.

    Returns:
        Diccionario con: cuota_mensual, desglose, fundamento_legal, documento_markdown.
    """
    # ── Cálculo base ──────────────────────────────────────────────────────
    # Descuentos estimados (seguridad social ~28.5% para trabajadores dependientes)
    descuento_ss = 0.285
    ingreso_neto = round(data.ingresos_alimentante * (1 - descuento_ss))

    # Mínimo legal: 30% del ingreso neto dividido entre hijos
    cuota_minima_total = round(ingreso_neto * 0.30)
    cuota_por_hijo_base = round(cuota_minima_total / data.num_hijos)

    # Necesidades mínimas por edad (tabla ICBF aproximada)
    necesidades_por_edad = {
        range(0, 2): round(SMMLV_2024 * 0.35),   # Lactantes: mayor costo
        range(2, 6): round(SMMLV_2024 * 0.30),
        range(6, 12): round(SMMLV_2024 * 0.35),
        range(12, 18): round(SMMLV_2024 * 0.40),
        range(18, 26): round(SMMLV_2024 * 0.45),  # Si estudia
    }

    necesidad_por_hijo: list[int] = []
    for edad in data.edades_hijos:
        necesidad = SMMLV_2024 * 0.35  # default
        for rango, valor in necesidades_por_edad.items():
            if edad in rango:
                necesidad = valor
                break
        necesidad_por_hijo.append(int(necesidad))

    # Gastos adicionales proporcionales a cargo del alimentante
    gastos_adicionales = data.gastos_educacion + data.gastos_salud
    vivienda_proporcional = round(data.gastos_vivienda * 0.5)  # 50% a cargo del alimentante

    cuota_ajustada = max(
        cuota_por_hijo_base * data.num_hijos,
        sum(necesidad_por_hijo),
    ) + gastos_adicionales + vivienda_proporcional

    # Si el alimentante tiene bajos ingresos, aplicar cuota mínima ICBF
    cuota_minima_icbf = round(SMMLV_2024 * 0.25)
    cuota_final = max(cuota_ajustada, cuota_minima_icbf)

    # No puede superar el 50% del ingreso neto (para evitar insubsistencia)
    cuota_maxima = round(ingreso_neto * 0.50)
    cuota_final = min(cuota_final, cuota_maxima)

    desglose = {
        "ingreso_bruto_alimentante": data.ingresos_alimentante,
        "descuento_seguridad_social_estimado": round(data.ingresos_alimentante * descuento_ss),
        "ingreso_neto_estimado": ingreso_neto,
        "cuota_minima_30_porciento": cuota_minima_total,
        "gastos_educacion_mensuales": data.gastos_educacion,
        "gastos_salud_mensuales": data.gastos_salud,
        "vivienda_proporcional": vivienda_proporcional,
        "cuota_final_calculada": cuota_final,
        "cuota_por_hijo": round(cuota_final / data.num_hijos),
        "num_hijos": data.num_hijos,
        "edades_hijos": data.edades_hijos,
        "equivalencia_smmlv": round(cuota_final / SMMLV_2024, 2),
    }

    fundamento_legal = [
        "Art. 24 Código Civil - Obligación alimentaria",
        "Ley 1098 de 2006 (Código de la Infancia y la Adolescencia) Arts. 24, 111-133",
        "CSJ Sala Civil, Sentencia SC-14673-2016: mínimo 30% del ingreso neto",
        "Tabla de cuotas alimentarias del ICBF (actualización 2024)",
        "Art. 129 Código de la Infancia: criterios para fijación de alimentos",
        f"SMMLV 2024: ${SMMLV_2024:,} COP (referencia de cuota mínima)",
    ]

    # ── Generar documento con Gemini ──────────────────────────────────────
    prompt = f"""Genera un DOCUMENTO DE CUOTA ALIMENTARIA en formato Markdown con los siguientes datos calculados:

**ALIMENTANTE:** {data.nombre_alimentante}
**BENEFICIARIO:** {data.nombre_beneficiario}
**CIUDAD:** {data.ciudad}
**NÚMERO DE HIJOS:** {data.num_hijos}
**EDADES:** {', '.join(str(e) + ' años' for e in data.edades_hijos)}

**CÁLCULO ECONÓMICO:**
- Ingresos brutos del alimentante: ${data.ingresos_alimentante:,} COP
- Ingresos netos estimados: ${ingreso_neto:,} COP
- Cuota mínima legal (30%): ${cuota_minima_total:,} COP
- Gastos educación: ${data.gastos_educacion:,} COP/mes
- Gastos salud: ${data.gastos_salud:,} COP/mes
- Vivienda proporcional: ${vivienda_proporcional:,} COP/mes
- **CUOTA MENSUAL FIJADA: ${cuota_final:,} COP**

**FUNDAMENTOS LEGALES:**
{chr(10).join('- ' + f for f in fundamento_legal)}

El documento debe incluir:
1. Encabezado formal
2. Identificación de las partes
3. Análisis de la capacidad económica del alimentante
4. Análisis de las necesidades del beneficiario según edad
5. Desglose de gastos considerados
6. Cuota alimentaria fijada con justificación
7. Forma de pago (consignación bancaria, fecha límite)
8. Mecanismo de actualización anual (IPC o SMMLV)
9. Fundamento legal completo con artículos y jurisprudencia
10. Advertencias legales (proceso ejecutivo por mora, inasistencia alimentaria penal)"""

    client = genai.Client(api_key=api_key)

    response = client.models.generate_content(
        model="gemini-2.0-flash",
        contents=prompt,
        config=types.GenerateContentConfig(
            system_instruction=SYSTEM_PROMPT,
            temperature=0.15,
            max_output_tokens=3000,
        ),
    )

    return {
        "cuota_mensual": cuota_final,
        "cuota_por_hijo": round(cuota_final / data.num_hijos),
        "desglose": desglose,
        "fundamento_legal": fundamento_legal,
        "documento_markdown": response.text,
    }
