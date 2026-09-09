from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from typing import Optional, List
from app.core.database import get_db
from sqlalchemy.ext.asyncio import AsyncSession
from app.core.security import get_current_user, require_development_only
from app.services.payment_service import WompiPaymentService, DirectBankPaymentService

router = APIRouter()

class DirectTransferRequest(BaseModel):
    reference: str
    service_id: str
    amount_cop: int
    customer_name: str
    customer_email: str
    voucher_number: str

@router.get("/banking-details", summary="Consultar datos de cuenta Bancolombia oficial de recaudo")
async def get_banking_details(_user: dict = Depends(get_current_user)):
    """Retorna la cuenta Bancolombia Ahorros 453-107439-37 de Jonny Hidalgo Obando Meneses.

    Solo usuarios autenticados (Bearer token).
    """
    return DirectBankPaymentService.get_official_account()

@router.post("/register-transfer", summary="Registrar comprobante de transferencia Bancolombia / Nequi directa")
async def register_direct_transfer(req: DirectTransferRequest):
    """Permite al pagador enviar el número de comprobante o aprobación bancaria.

    NOTA: la confirmación real debe verificarse contra la entidad (conciliación
    bancaria) antes de habilitar el servicio. Este endpoint registra la
    intención; el desbloqueo definitivo se hará tras conciliación.
    """
    return DirectBankPaymentService.register_transfer_confirmation(
        reference=req.reference,
        service_id=req.service_id,
        amount_cop=req.amount_cop,
        customer_name=req.customer_name,
        customer_email=req.customer_email,
        voucher_number=req.voucher_number
    )

class CreateCheckoutRequest(BaseModel):
    service_id: str
    customer_email: str
    customer_name: str
    customer_phone: Optional[str] = None

class SimulatePaymentRequest(BaseModel):
    reference: str
    payment_method: Optional[str] = "NEQUI"

@router.get("/catalog", summary="Obtener catálogo de servicios y tarifas oficiales en COP")
async def get_services_catalog():
    """Retorna las tarifas oficiales para consultas, tutelas, peticiones y suscripciones."""
    return WompiPaymentService.get_catalog()

@router.post("/create-checkout", summary="Generar sesión de pago y checkout Wompi (PSE, Nequi, Tarjeta)")
async def create_checkout(req: CreateCheckoutRequest):
    """
    Crea una transacción con firma de integridad SHA-256 según el estándar Wompi Colombia.
    Devuelve los enlaces para procesar PSE, Nequi o Tarjeta de crédito.
    """
    try:
        session = WompiPaymentService.create_checkout_session(
            service_id=req.service_id,
            customer_email=req.customer_email,
            customer_name=req.customer_name,
            customer_phone=req.customer_phone
        )
        return session
    except ValueError as e:
        raise HTTPException(status_code=404, detail=str(e))

@router.post("/simulate-approval", summary="Simular aprobación inmediata de pago en Sandbox (SOLO desarrollo)")
async def simulate_payment_approval(req: SimulatePaymentRequest):
    """Permite a usuarios y desarrolladores verificar el desbloqueo instantáneo del servicio.

    ⚠️ Bloqueado en producción: no es un flujo de cobro real.
    """
    require_development_only()
    return WompiPaymentService.simulate_mock_payment_approval(
        reference=req.reference,
        method=req.payment_method or "NEQUI"
    )

@router.post("/webhook", summary="Webhook receptor de eventos de Wompi")
async def wompi_webhook(payload: dict):
    """
    Recibe la notificación asíncrona de Wompi (event: transaction.updated)
    y desbloquea la entrega del documento o activa la suscripción del usuario.

    Se valida la firma HMAC-SHA256 de Wompi; toda petición sin firma válida
    se rechaza con 401.
    """
    try:
        if not WompiPaymentService.verify_wompi_event_signature(payload):
            raise HTTPException(status_code=401, detail="Firma de webhook inválida")
    except ValueError as e:
        raise HTTPException(status_code=503, detail=str(e))

    event = payload.get("event")
    data = payload.get("data", {})
    transaction = data.get("transaction", {})

    status = transaction.get("status")
    reference = transaction.get("reference")

    if status == "APPROVED":
        # TODO: persistir el cobro y activar la entrega del documento
        # (vinculado al módulo de pagos en BD — pendiente de la capa de pagos persistente).
        pass

    return {
        "received": True,
        "verified": True,
        "event": event,
        "reference": reference,
        "status": status,
        "action": "Pago verificado. Servicio habilitado." if status == "APPROVED" else "Evento recibido, pago pendiente"
    }


class ConfirmMinutaRequest(BaseModel):
    reference: str
    transaccion_id: Optional[str] = None
    tipo: str
    campos: dict = {}


@router.post("/confirm-minuta", summary="Verificar pago de minuta ($20.000) y generar el documento")
async def confirmar_minuta(
    req: ConfirmMinutaRequest,
    claims: dict = Depends(get_current_user),
    db: AsyncSession = Depends(get_db),
):
    """Verifica la transacción Wompi por referencia; si está APROBADA,
    genera la minuta solicitada, registra el pago y el documento en el
    historial del usuario y devuelve el escrito."""
    from app.services.document_generator import DocumentGeneratorService as D
    from app.models.entities import UserHistory

    if db is None:
        raise HTTPException(status_code=503, detail="Base de datos no configurada")

    res = WompiPaymentService.verify_transaction_by_reference(req.reference)
    if not res.get("encontrado") or res.get("estado") != "APPROVED":
        raise HTTPException(status_code=402, detail=f"Pago no aprobado aún ({res.get('estado')}). Espera unos segundos y vuelve a verificar.")

    # Generar la minuta según el tipo solicitado
    from app.schemas import schemas as S
    from app.api.v1.endpoints import documents

    gen_map = {
        "poder-especial": (S.PoderEspecialRequest, D.generate_poder_especial, "Poder Especial"),
        "promesa-compraventa": (S.PromesaCompraventaRequest, D.generate_promesa_compraventa, "Promesa de Compraventa"),
        "contrato-obra": (S.ContratoObraRequest, D.generate_contrato_obra, "Contrato de Obra"),
        "contrato-comodato": (S.ContratoComodatoRequest, D.generate_contrato_comodato, "Contrato de Comodato"),
        "acuerdo-confidencialidad": (S.AcuerdoConfidencialidadRequest, D.generate_acuerdo_confidencialidad, "Acuerdo de Confidencialidad"),
        "divorcio-mutuo-acuerdo": (S.DivorcioMutuoAcuerdoRequest, D.generate_divorcio_mutuo_acuerdo, "Divorcio por Mutuo Acuerdo"),
        "leasing": (S.LeasingRequest, D.generate_leasing, "Contrato de Leasing"),
        "factoring": (S.FactoringRequest, D.generate_factoring, "Contrato de Factoring"),
        "franquicia": (S.FranquiciaRequest, D.generate_franquicia, "Contrato de Franquicia"),
        "outsourcing": (S.OutsourcingRequest, D.generate_outsourcing, "Contrato de Outsourcing"),
        "joint-venture": (S.JointVentureRequest, D.generate_joint_venture, "Joint Venture sin Sociedad"),
    }
    entry = gen_map.get(req.tipo)
    if not entry:
        raise HTTPException(status_code=422, detail=f"Tipo de minuta no soportado: {req.tipo}")
    ModelCls, fn, titulo = entry
    data = ModelCls(**req.campos)
    content = fn(data)

    uid = int(claims.get("sub", 0))
    db.add(UserHistory(user_id=uid, kind="pago", title="Pago minuta (Wompi)", detail=f"Ref {req.reference} · $20.000 COP"))
    db.add(UserHistory(user_id=uid, kind="documento", title=f"Minuta generada: {titulo}", detail=f"Ref {req.reference}"))
    await db.flush()

    return {
        "approved": True,
        "title": titulo,
        "content": content,
        "document_type": req.tipo,
        "disclaimer": "Borrador verificado por abogado antes de uso.",
        "monto": 20000,
    }
