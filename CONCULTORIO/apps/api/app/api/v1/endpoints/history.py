"""
Historial del usuario autenticado.
Reposa toda su información: procesos, alertas, sugerencias judiciales,
documentos, recordatorios, asistencia y pagos.
"""
from datetime import datetime
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import UserHistory

router = APIRouter()

HISTORY_KINDS = {
    "proceso", "alerta", "sugerencia", "documento",
    "recordatorio", "asistencia", "pago",
}


class HistoryCreate(BaseModel):
    kind: str
    title: str
    detail: Optional[str] = None
    meta: Optional[Dict[str, Any]] = None


class HistoryOut(BaseModel):
    id: int
    kind: str
    title: str
    detail: Optional[str]
    meta: Optional[Dict[str, Any]]
    created_at: datetime

    class Config:
        from_attributes = True


@router.post("/", response_model=HistoryOut, summary="Registrar evento en el historial")
async def create_history(
    body: HistoryCreate,
    claims: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    if body.kind not in HISTORY_KINDS:
        raise HTTPException(status_code=422, detail=f"Tipo inválido: {body.kind}")
    row = UserHistory(
        user_id=int(claims.get("sub", 0)),
        kind=body.kind,
        title=body.title[:255],
        detail=body.detail,
        meta=body.meta or {},
    )
    db.add(row)
    await db.flush()
    await db.refresh(row)
    return row


@router.get("/", response_model=List[HistoryOut], summary="Obtener mi historial")
async def list_history(
    kind: Optional[str] = None,
    claims: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    q = select(UserHistory).where(UserHistory.user_id == int(claims.get("sub", 0)))
    if kind:
        q = q.where(UserHistory.kind == kind)
    q = q.order_by(UserHistory.created_at.desc()).limit(200)
    result = await db.execute(q)
    return result.scalars().all()
