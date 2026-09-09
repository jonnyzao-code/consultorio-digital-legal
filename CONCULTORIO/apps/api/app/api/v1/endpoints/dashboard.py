"""
Dashboard general por cuenta: casos consultados, minutas generadas,
procesos en seguimiento, pagos, recordatorios y asistencia.
"""
from datetime import datetime
from typing import Any, Dict, List

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import func, select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import UserHistory

router = APIRouter()

KINDS = ["proceso", "documento", "pago", "recordatorio", "alerta", "asistencia", "sugerencia"]


@router.get("/", summary="Dashboard general del usuario")
async def dashboard(
    claims: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    uid = int(claims.get("sub", 0))

    counts: Dict[str, int] = {}
    for k in KINDS:
        r = await db.execute(
            select(func.count())
            .select_from(UserHistory)
            .where(UserHistory.user_id == uid, UserHistory.kind == k)
        )
        counts[k] = r.scalar() or 0

    res = await db.execute(
        select(UserHistory)
        .where(UserHistory.user_id == uid)
        .order_by(UserHistory.created_at.desc())
        .limit(12)
    )
    eventos = res.scalars().all()

    return {
        "minutas_generadas": counts["documento"],
        "procesos_consultados": counts["proceso"],
        "procesos_seguimiento": counts["proceso"] + counts["alerta"],
        "recordatorios": counts["recordatorio"],
        "pagos": counts["pago"],
        "asistencia": counts["asistencia"],
        "sugerencias": counts["sugerencia"],
        "recientes": [
            {
                "kind": e.kind,
                "title": e.title,
                "detail": e.detail,
                "created_at": e.created_at.isoformat() if e.created_at else None,
            }
            for e in eventos
        ],
    }
