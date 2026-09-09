"""Router de alertas y monitoreo de procesos judiciales."""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Usuario, ProcesoMonitoreado
from app.schemas import ProcesoCreate, ProcesoResponse
from app.services.auth_service import get_current_user

router = APIRouter()


@router.post("/suscribir", response_model=ProcesoResponse, status_code=201)
async def suscribir_proceso(
    data: ProcesoCreate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Suscribe un proceso judicial al monitoreo automático."""
    proceso = ProcesoMonitoreado(
        usuario_id=current_user.id,
        numero_radicado=data.numero_radicado,
        tipo_proceso=data.tipo_proceso,
        entidad=data.entidad,
    )
    db.add(proceso)
    await db.commit()
    await db.refresh(proceso)
    return ProcesoResponse.model_validate(proceso)


@router.get("/procesos", response_model=List[ProcesoResponse])
async def listar_procesos(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lista los procesos judiciales monitoreados del usuario."""
    result = await db.execute(
        select(ProcesoMonitoreado)
        .where(
            ProcesoMonitoreado.usuario_id == current_user.id,
            ProcesoMonitoreado.activo == True,
        )
        .order_by(ProcesoMonitoreado.created_at.desc())
    )
    return [ProcesoResponse.model_validate(p) for p in result.scalars().all()]


@router.delete("/procesos/{proceso_id}", status_code=204)
async def cancelar_monitoreo(
    proceso_id: uuid.UUID,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Cancela el monitoreo de un proceso judicial."""
    result = await db.execute(
        select(ProcesoMonitoreado).where(ProcesoMonitoreado.id == proceso_id)
    )
    proceso = result.scalar_one_or_none()
    if not proceso or proceso.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Proceso no encontrado")

    proceso.activo = False
    await db.commit()
