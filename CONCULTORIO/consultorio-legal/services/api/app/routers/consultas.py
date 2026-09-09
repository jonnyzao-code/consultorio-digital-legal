"""Router de consultas legales."""
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Usuario, Consulta
from app.schemas import ConsultaCreate, ConsultaResponse, ConsultaUpdate, ClasificarRequest, ClasificarResponse
from app.services.auth_service import get_current_user
from app.services import gemini_service

router = APIRouter()


@router.post("/clasificar", response_model=ClasificarResponse)
async def clasificar(
    data: ClasificarRequest,
    current_user: Usuario = Depends(get_current_user),
):
    """Clasifica una descripción de problema legal en una rama del derecho."""
    resultado = await gemini_service.clasificar_consulta(data.texto)
    return ClasificarResponse(**resultado)


@router.post("/", response_model=ConsultaResponse, status_code=201)
async def crear_consulta(
    data: ConsultaCreate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crea una nueva consulta legal."""
    consulta = Consulta(
        usuario_id=current_user.id,
        descripcion=data.descripcion,
        rama_derecho=data.rama_derecho,
        datos_adicionales=data.datos_adicionales,
        pro_bono=data.pro_bono,
    )
    db.add(consulta)
    await db.commit()
    await db.refresh(consulta)
    return ConsultaResponse.model_validate(consulta)


@router.get("/", response_model=List[ConsultaResponse])
async def listar_consultas(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lista todas las consultas del usuario autenticado."""
    result = await db.execute(
        select(Consulta)
        .where(Consulta.usuario_id == current_user.id)
        .order_by(Consulta.created_at.desc())
    )
    return [ConsultaResponse.model_validate(c) for c in result.scalars().all()]


@router.get("/{consulta_id}", response_model=ConsultaResponse)
async def detalle_consulta(
    consulta_id: uuid.UUID,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Obtiene el detalle de una consulta."""
    result = await db.execute(select(Consulta).where(Consulta.id == consulta_id))
    consulta = result.scalar_one_or_none()
    if not consulta or consulta.usuario_id != current_user.id:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")
    return ConsultaResponse.model_validate(consulta)


@router.patch("/{consulta_id}", response_model=ConsultaResponse)
async def actualizar_consulta(
    consulta_id: uuid.UUID,
    data: ConsultaUpdate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Actualiza el estado de una consulta (solo abogados/admin)."""
    result = await db.execute(select(Consulta).where(Consulta.id == consulta_id))
    consulta = result.scalar_one_or_none()
    if not consulta:
        raise HTTPException(status_code=404, detail="Consulta no encontrada")

    for field, value in data.model_dump(exclude_none=True).items():
        setattr(consulta, field, value)

    await db.commit()
    await db.refresh(consulta)
    return ConsultaResponse.model_validate(consulta)
