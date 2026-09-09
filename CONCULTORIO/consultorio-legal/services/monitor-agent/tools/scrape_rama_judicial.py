"""Scraping de la Rama Judicial colombiana — Consulta de procesos por radicado."""
import asyncio
import httpx
from typing import Optional

RAMA_JUDICIAL_API = "https://consultaprocesos.ramajudicial.gov.co/api/v2"

HEADERS = {
    "User-Agent": (
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) "
        "AppleWebKit/537.36 (KHTML, like Gecko) "
        "Chrome/120.0.0.0 Safari/537.36"
    ),
    "Accept": "application/json",
    "Accept-Language": "es-CO,es;q=0.9",
    "Referer": "https://consultaprocesos.ramajudicial.gov.co/",
}


async def consultar_proceso_judicial(numero_radicado: str) -> dict:
    """
    Consulta un proceso judicial por número de radicado en la Rama Judicial.
    
    Args:
        numero_radicado: Número de radicado del proceso (ej: 11001310300120230012300)
    
    Returns:
        dict con: radicado, juzgado, tipo_proceso, partes, ultimo_estado, actuaciones
    """
    radicado_limpio = numero_radicado.strip().replace(" ", "").replace("-", "")

    async with httpx.AsyncClient(
        headers=HEADERS,
        timeout=30,
        follow_redirects=True,
    ) as client:
        # Intentar API oficial primero
        try:
            response = await client.get(
                f"{RAMA_JUDICIAL_API}/Procesos/Consulta/NumeroRadicacion",
                params={
                    "numero": radicado_limpio,
                    "SoloActivos": False,
                },
            )
            response.raise_for_status()
            data = response.json()

            procesos = data.get("procesos", [])
            if not procesos:
                return {
                    "radicado": radicado_limpio,
                    "encontrado": False,
                    "mensaje": "No se encontraron procesos con ese número de radicado",
                    "ultimo_estado": "",
                }

            proceso = procesos[0]
            actuaciones = proceso.get("actuaciones", [])
            ultimo_estado = actuaciones[0].get("actuacion", "") if actuaciones else ""

            return {
                "radicado": radicado_limpio,
                "encontrado": True,
                "juzgado": proceso.get("despacho", ""),
                "tipo_proceso": proceso.get("tipoProceso", ""),
                "clase_proceso": proceso.get("claseProceso", ""),
                "partes": proceso.get("sujetos", []),
                "ultimo_estado": ultimo_estado,
                "ultima_actuacion_fecha": actuaciones[0].get("fechaActuacion", "") if actuaciones else "",
                "actuaciones": [
                    {
                        "fecha": a.get("fechaActuacion", ""),
                        "actuacion": a.get("actuacion", ""),
                        "anotacion": a.get("anotacion", ""),
                    }
                    for a in actuaciones[:5]  # Últimas 5 actuaciones
                ],
            }

        except httpx.HTTPStatusError as e:
            return {
                "radicado": radicado_limpio,
                "encontrado": False,
                "error": f"Error HTTP {e.response.status_code}",
                "ultimo_estado": "",
            }
        except Exception as e:
            return {
                "radicado": radicado_limpio,
                "encontrado": False,
                "error": str(e),
                "ultimo_estado": "",
            }


async def consultar_por_nombre(nombre_demandante: str, nombre_demandado: str = "") -> list[dict]:
    """Consulta procesos por nombre de las partes."""
    async with httpx.AsyncClient(headers=HEADERS, timeout=30) as client:
        try:
            response = await client.get(
                f"{RAMA_JUDICIAL_API}/Procesos/Consulta/NombreRazonSocial",
                params={
                    "nombre": nombre_demandante,
                    "SoloActivos": True,
                },
            )
            response.raise_for_status()
            data = response.json()
            return data.get("procesos", [])
        except Exception as e:
            print(f"Error consultando por nombre: {e}")
            return []


if __name__ == "__main__":
    # Test
    async def test():
        resultado = await consultar_proceso_judicial("11001310300120230012300")
        print(resultado)

    asyncio.run(test())
