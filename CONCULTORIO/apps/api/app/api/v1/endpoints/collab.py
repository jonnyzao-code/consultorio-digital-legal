"""
Cooperativa de abogados: asignación de casos según especialidad, carga de
trabajo, valoración de clientes y eficiencia/eficacia (resultados).
"""
from typing import Any, Dict

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.entities import LawyerProfile, User

router = APIRouter()


def _score(lp: LawyerProfile, branch: str) -> Dict[str, Any]:
    """Puntuación del abogado: 40% especialidad, 20% carga (menos = mejor),
    20% valoración de clientes, 20% eficiencia (resueltos/asignados)."""
    spec = lp.specialties or []
    if branch and branch in spec:
        spec_match = 1.0
    elif not spec:
        spec_match = 0.5
    else:
        spec_match = 0.0
    carga = lp.cases_assigned_count or 0
    eficiencia = (lp.cases_resolved_count / carga) if carga > 0 else 0.0
    rating = (lp.rating_sum / lp.rating_count) if (lp.rating_count or 0) > 0 else 0.0
    score = round(
        spec_match * 40
        + max(0.0, 1 - carga / 50) * 20
        + (rating / 5) * 20
        + min(eficiencia, 1.0) * 20,
        2,
    )
    return {
        "especialidad_match": round(spec_match, 2),
        "carga": carga,
        "valoracion": round(rating, 2),
        "eficiencia": round(eficiencia, 2),
        "score": score,
    }


async def _rows(db: AsyncSession):
    res = await db.execute(
        select(LawyerProfile, User).join(User, User.id == LawyerProfile.user_id)
    )
    return res.all()


@router.get("/leaderboard", summary="Ranking de abogados cooperativos")
async def leaderboard(
    _claims: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    out = []
    for lp, u in await _rows(db):
        s = _score(lp, "")
        out.append(
            {
                "id": lp.id,
                "nombre": u.full_name,
                "tarjeta": lp.professional_card,
                "especialidades": lp.specialties or [],
                "casos_asignados": lp.cases_assigned_count or 0,
                "casos_resueltos": lp.cases_resolved_count or 0,
                "disponible": lp.is_available,
                **s,
            }
        )
    out.sort(key=lambda x: -x["score"])
    return out


class AssignRequest(BaseModel):
    branch: str


@router.post("/assign-case", summary="Asignar caso al mejor abogado según criterios")
async def assign_case(
    body: AssignRequest,
    _claims: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    res = await db.execute(
        select(LawyerProfile, User)
        .join(User, User.id == LawyerProfile.user_id)
        .where(LawyerProfile.is_available == True)  # noqa: E712
    )
    rows = res.all()
    if not rows:
        raise HTTPException(status_code=404, detail="No hay abogados cooperativos disponibles")
    scored = []
    for lp, u in rows:
        s = _score(lp, body.branch)
        scored.append({"lp": lp, "nombre": u.full_name, **s})
    mejor = max(scored, key=lambda x: x["score"])
    mejor["lp"].cases_assigned_count = (mejor["lp"].cases_assigned_count or 0) + 1
    await db.flush()
    return {
        "asignado": {
            "nombre": mejor["nombre"],
            "tarjeta": mejor["lp"].professional_card,
            "especialidades": mejor["lp"].specialties or [],
            "score": mejor["score"],
            "desglose": {k: v for k, v in mejor.items() if k not in ("lp", "nombre")},
        }
    }


class RateRequest(BaseModel):
    rating: int  # 1..5


@router.post("/rate/{lawyer_id}", summary="Valorar el trabajo de un abogado (1 a 5)")
async def rate(
    lawyer_id: int,
    body: RateRequest,
    _claims: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")
    if body.rating < 1 or body.rating > 5:
        raise HTTPException(status_code=422, detail="La valoración debe estar entre 1 y 5")
    lp = (
        await db.execute(select(LawyerProfile).where(LawyerProfile.id == lawyer_id))
    ).scalar_one_or_none()
    if not lp:
        raise HTTPException(status_code=404, detail="Abogado no encontrado")
    lp.rating_sum = (lp.rating_sum or 0.0) + body.rating
    lp.rating_count = (lp.rating_count or 0) + 1
    await db.flush()
    return {
        "ok": True,
        "promedio": round(lp.rating_sum / lp.rating_count, 2),
        "valoraciones": lp.rating_count,
    }
