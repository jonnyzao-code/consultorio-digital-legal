"""Router de pagos — integración Wompi."""
import hashlib
import uuid
from typing import List
from fastapi import APIRouter, Depends, HTTPException, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select

from app.database import get_db
from app.models import Usuario, Pago, EstadoPago
from app.schemas import PagoCreate, PagoResponse
from app.services.auth_service import get_current_user
from app.config import get_settings

router = APIRouter()
settings = get_settings()


@router.post("/crear-orden", response_model=PagoResponse, status_code=201)
async def crear_orden(
    data: PagoCreate,
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Crea una orden de pago en el sistema. El widget Wompi se inicializa en el frontend."""
    pago = Pago(
        usuario_id=current_user.id,
        consulta_id=data.consulta_id,
        monto=data.monto,
        moneda=data.moneda,
    )
    db.add(pago)
    await db.commit()
    await db.refresh(pago)
    return PagoResponse.model_validate(pago)


@router.post("/webhook")
async def wompi_webhook(request: Request, db: AsyncSession = Depends(get_db)):
    """
    Recibe notificaciones de Wompi y actualiza el estado del pago.
    Verifica la firma SHA256 para autenticidad.
    """
    body = await request.json()

    # Verificar firma Wompi
    evento = body.get("data", {}).get("transaction", {})
    referencia = evento.get("reference", "")
    monto_centavos = str(evento.get("amount_in_cents", ""))
    moneda = evento.get("currency", "COP")
    estado_wompi = evento.get("status", "")
    checksum_recibido = body.get("signature", {}).get("checksum", "")

    # Calcular checksum esperado
    concat = f"{referencia}{monto_centavos}{moneda}{estado_wompi}{settings.WOMPI_EVENTS_KEY}"
    checksum_esperado = hashlib.sha256(concat.encode()).hexdigest()

    if checksum_recibido != checksum_esperado:
        raise HTTPException(status_code=400, detail="Firma inválida")

    # Actualizar pago en DB
    result = await db.execute(
        select(Pago).where(Pago.referencia_interna == referencia)
    )
    pago = result.scalar_one_or_none()
    if pago:
        pago.estado = EstadoPago.aprobado if estado_wompi == "APPROVED" else EstadoPago.rechazado
        pago.referencia_wompi = evento.get("id", "")
        await db.commit()

    return {"status": "ok"}


@router.get("/historial", response_model=List[PagoResponse])
async def historial_pagos(
    current_user: Usuario = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Lista el historial de pagos del usuario."""
    result = await db.execute(
        select(Pago)
        .where(Pago.usuario_id == current_user.id)
        .order_by(Pago.created_at.desc())
    )
    return [PagoResponse.model_validate(p) for p in result.scalars().all()]
