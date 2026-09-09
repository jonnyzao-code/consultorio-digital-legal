"""Monitor Agent — Servidor FastAPI + Scheduler para monitoreo de procesos judiciales."""
import asyncio
import os
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI
from dotenv import load_dotenv

from tools.scrape_rama_judicial import consultar_proceso_judicial
from tools.enviar_alerta_email import enviar_alerta_email
from tools.enviar_alerta_whatsapp import enviar_alerta_whatsapp

load_dotenv()

scheduler = AsyncIOScheduler(timezone="America/Bogota")

# Almacenamiento en memoria para demo (en producción usar DB compartida)
procesos_activos: dict[str, dict] = {}


async def verificar_novedades():
    """Revisa cada proceso activo y envía alertas si hay novedades."""
    print(f"[MonitorAgent] Verificando {len(procesos_activos)} procesos...")
    for radicado, info in list(procesos_activos.items()):
        try:
            resultado = await consultar_proceso_judicial(radicado)
            nuevo_estado = resultado.get("ultimo_estado", "")
            ultimo_conocido = info.get("ultimo_estado", "")

            if nuevo_estado and nuevo_estado != ultimo_conocido:
                print(f"[MonitorAgent] ¡Novedad en {radicado}!")

                # Enviar alertas
                if info.get("email"):
                    await enviar_alerta_email(
                        destinatario=info["email"],
                        nombre=info.get("nombre", "Usuario"),
                        numero_radicado=radicado,
                        novedad=nuevo_estado,
                        url_detalle=f"https://consultoriodigital.co/procesos/{radicado}",
                    )
                if info.get("telefono"):
                    await enviar_alerta_whatsapp(
                        telefono=info["telefono"],
                        nombre=info.get("nombre", "Usuario"),
                        radicado=radicado,
                        novedad=nuevo_estado,
                    )

                # Actualizar estado
                procesos_activos[radicado]["ultimo_estado"] = nuevo_estado

        except Exception as e:
            print(f"[MonitorAgent] Error verificando {radicado}: {e}")


@asynccontextmanager
async def lifespan(app: FastAPI):
    scheduler.add_job(
        verificar_novedades,
        "interval",
        hours=6,
        id="verificar_novedades",
        replace_existing=True,
    )
    scheduler.start()
    print("🔍 Monitor Agent iniciado. Verificando procesos cada 6 horas.")
    yield
    scheduler.shutdown()


app = FastAPI(
    title="Monitor Agent — Consultorio Digital Legal",
    version="0.1.0",
    lifespan=lifespan,
)


@app.post("/suscribir-proceso")
async def suscribir(data: dict):
    """Agrega un proceso al monitoreo."""
    radicado = data.get("numero_radicado")
    if not radicado:
        return {"error": "numero_radicado requerido"}

    procesos_activos[radicado] = {
        "usuario_id": data.get("usuario_id"),
        "nombre": data.get("nombre", "Usuario"),
        "email": data.get("email"),
        "telefono": data.get("telefono"),
        "ultimo_estado": "",
    }
    return {"status": "suscrito", "radicado": radicado}


@app.get("/procesos/{usuario_id}")
async def listar(usuario_id: str):
    """Lista procesos activos de un usuario."""
    return {
        "procesos": [
            {"radicado": r, **info}
            for r, info in procesos_activos.items()
            if info.get("usuario_id") == usuario_id
        ]
    }


@app.delete("/procesos/{radicado}")
async def cancelar(radicado: str):
    """Cancela el monitoreo de un proceso."""
    if radicado in procesos_activos:
        del procesos_activos[radicado]
    return {"status": "cancelado"}


@app.post("/verificar-ahora")
async def verificar_ahora():
    """Fuerza una verificación inmediata (útil para testing)."""
    await verificar_novedades()
    return {"status": "verificado"}


@app.get("/health")
async def health():
    return {
        "status": "ok",
        "procesos_monitoreados": len(procesos_activos),
        "scheduler_running": scheduler.running,
    }


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("agent:app", host="0.0.0.0", port=8003, reload=True)
