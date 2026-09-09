"""
Servicio de Pagos y Monetización — Wompi Colombia
Implementa el catálogo de tarifas, cálculo de firma de integridad SHA-256,
creación de transacciones y conciliación de eventos/webhooks.
"""
import hashlib
import hmac
import uuid
import urllib.parse
from datetime import datetime
from typing import Dict, Any, List, Optional
from app.core.config import settings
from app.models.entities import PaymentStatus

# Catálogo oficial de servicios tarifados en Colombia (COP)
LEGAL_SERVICES_PRICING = {
    "consulta_expres": {
        "id": "consulta_expres",
        "name": "Consulta Jurídica Exprés (IA + Abogado)",
        "description": "Orientación legal inmediata con IA, calificación de viabilidad y revisión de abogado especialista.",
        "amount_in_cop": 35000,
        "category": "consulta",
        "delivery_time": "Inmediato (menos de 1 hora)"
    },
    "tutela_salud_vida": {
        "id": "tutela_salud_vida",
        "name": "Acción de Tutela con Medida Cautelar",
        "description": "Elaboración de escrito de tutela judicial, solicitud de suspensión provisional de perjuicio y guía de radicación virtual.",
        "amount_in_cop": 55000,
        "category": "documento",
        "delivery_time": "Descarga instantánea"
    },
    "derecho_peticion": {
        "id": "derecho_peticion",
        "name": "Derecho de Petición Prioritario (Ley 1755/15)",
        "description": "Escrito formal ante EPS, fondos de pensiones, bancos o entidades del Estado con términos perentorios de respuesta.",
        "amount_in_cop": 30000,
        "category": "documento",
        "delivery_time": "Descarga instantánea"
    },
    "liquidacion_alimentos": {
        "id": "liquidacion_alimentos",
        "name": "Liquidación Judicial de Alimentos",
        "description": "Cálculo certificado de cuota alimentaria, aplicación de topes de inembargabilidad del 50% y certificado legal.",
        "amount_in_cop": 40000,
        "category": "documento",
        "delivery_time": "Descarga instantánea"
    },
    "suscripcion_mensual": {
        "id": "suscripcion_mensual",
        "name": "Plan Suscripción Mensual 'Tranquilidad Legal'",
        "description": "Monitoreo continuo de hasta 3 radicados judiciales en la Rama Judicial + consultas ilimitadas con IA + 2 documentos/mes.",
        "amount_in_cop": 120000,
        "category": "suscripcion",
        "delivery_time": "30 días de cobertura"
    },
    "minuta_generica": {
        "id": "minuta_generica",
        "name": "Generación de Minuta Jurídica (documento)",
        "description": "Generación de un documento jurídico (minuta) listo para revisión por abogado: contratos, poderes, tutelas, peticiones y más.",
        "amount_in_cop": 20000,
        "category": "documento",
        "delivery_time": "Pago aprobado → generación inmediata"
    },
    "paquete_tokens_5": {
        "id": "paquete_tokens_5",
        "name": "Paquete de 5 Tokens de Consultas",
        "description": "Bolsa prepagada de 5 consultas o revisiones de documentos sin vencimiento.",
        "amount_in_cop": 140000,
        "category": "tokens",
        "delivery_time": "Activación inmediata"
    }
}

# Cuenta bancaria de recaudo directo del titular
OFFICIAL_BANK_ACCOUNT = {
    "bank_name": "Bancolombia",
    "account_type": "Ahorros",
    "account_number": "453-107439-37",
    "account_number_clean": "45310743937",
    "account_holder": "Jonny Hidalgo Obando Meneses",
    "identification_type": "C.C.",
    "support_contact": "consultorio@legal.co",
    "methods_accepted": [
        "Transferencia directa App Bancolombia / Sucursal Virtual",
        "Código QR Bancolombia",
        "Transfiya desde cualquier entidad financiera (Davivienda, BBVA, etc.)",
        "Transferencia desde Nequi a cuenta de ahorros Bancolombia (gratis e inmediata)"
    ]
}

class DirectBankPaymentService:
    @staticmethod
    def get_official_account() -> Dict[str, Any]:
        """Retorna los datos oficiales de la cuenta Bancolombia de Jonny Hidalgo."""
        return OFFICIAL_BANK_ACCOUNT

    @staticmethod
    def register_transfer_confirmation(
        reference: str,
        service_id: str,
        amount_cop: int,
        customer_name: str,
        customer_email: str,
        voucher_number: str
    ) -> Dict[str, Any]:
        """
        Registra la confirmación de la transferencia directa hacia la cuenta Bancolombia de Jonny Hidalgo.
        """
        return {
            "reference": reference,
            "status": "APPROVED",
            "payment_type": "TRANSFERENCIA_BANCOLOMBIA_DIRECTA",
            "destination_account": OFFICIAL_BANK_ACCOUNT["account_number"],
            "account_holder": OFFICIAL_BANK_ACCOUNT["account_holder"],
            "voucher_number": voucher_number,
            "amount_cop": amount_cop,
            "customer": {
                "name": customer_name,
                "email": customer_email
            },
            "message": "Transferencia a cuenta Bancolombia registrada y aprobada. Acceso completo y sin marcas de agua desbloqueado.",
            "unlocked_features": [
                "Descarga de minuta procesal en Word/PDF",
                "Certificado de radicación electrónica",
                "Asignación de abogado especialista titular"
            ],
            "timestamp": datetime.utcnow().isoformat()
        }

class WompiPaymentService:
    @staticmethod
    def calculate_integrity_signature(reference: str, amount_in_cents: int, currency: str = "COP") -> str:
        """
        Calcula la firma de integridad SHA-256 oficial de Wompi:
        Cadena: {reference}{amount_in_cents}{currency}{integrity_secret}
        """
        secret = settings.WOMPI_INTEGRITY_SECRET
        if not secret:
            raise ValueError(
                "WOMPI_INTEGRITY_SECRET no está configurado (defínelo en el .env)"
            )
        raw_chain = f"{reference}{amount_in_cents}{currency}{secret}"
        return hashlib.sha256(raw_chain.encode("utf-8")).hexdigest()

    @classmethod
    def verify_wompi_event_signature(cls, payload: Dict[str, Any]) -> bool:
        """Verifica la firma HMAC-SHA256 de los eventos de Wompi (v1).

        Cadena oficial: transaction.id + transaction.status +
        transaction.amount_in_cents + transaction.currency, firmada con
        WOMPI_EVENTS_SECRET. Rechaza cualquier evento no firmado.
        """
        secret = settings.WOMPI_EVENTS_SECRET
        if not secret:
            raise ValueError("WOMPI_EVENTS_SECRET no está configurado (defínelo en el .env)")
        sig = payload.get("signature") or {}
        checksum = sig.get("checksum") or ""
        tx = (payload.get("data") or {}).get("transaction") or {}
        chain = "".join(
            [
                str(tx.get("id") or ""),
                str(tx.get("status") or ""),
                str(tx.get("amount_in_cents") or ""),
                str(tx.get("currency") or ""),
            ]
        )
        expected = hmac.new(secret.encode("utf-8"), chain.encode("utf-8"), hashlib.sha256).hexdigest()
        return hmac.compare_digest(expected, checksum)

    @classmethod
    def get_catalog(cls) -> List[Dict[str, Any]]:
        """Devuelve el catálogo de servicios legales con sus tarifas oficiales en COP."""
        return list(LEGAL_SERVICES_PRICING.values())

    @classmethod
    def create_checkout_session(
        cls,
        service_id: str,
        customer_email: str,
        customer_name: str,
        customer_phone: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Genera la sesión de pago para Wompi Colombia (PSE, Nequi, Tarjetas y Bancolombia).
        """
        service = LEGAL_SERVICES_PRICING.get(service_id)
        if not service:
            raise ValueError(f"Servicio con ID '{service_id}' no encontrado en el catálogo tarifario.")

        amount_in_cop = service["amount_in_cop"]
        # Descuento académico 10% para correos institucionales .edu.co
        # (p. ej. @unicervantes.edu.co).
        email_norm = (customer_email or "").strip().lower()
        descuento_edu_co = ".edu.co" in email_norm
        if descuento_edu_co:
            amount_in_cop = int(round(amount_in_cop * 0.90))
        amount_in_cents = amount_in_cop * 100
        currency = "COP"
        reference = f"CDL-{uuid.uuid4().hex[:10].upper()}"

        # Firma de integridad oficial Wompi (con el monto final, con o sin descuento)
        signature = cls.calculate_integrity_signature(reference, amount_in_cents, currency)

        return {
            "reference": reference,
            "service_id": service["id"],
            "service_name": service["name"],
            "amount_in_cop": amount_in_cop,
            "amount_in_cents": amount_in_cents,
            "descuento_edu_co": descuento_edu_co,
            "descuento_porcentaje": 10 if descuento_edu_co else 0,
            "monto_original_in_cop": service["amount_in_cop"],
            "currency": currency,
            "integrity_signature": signature,
            "public_key": settings.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
            "redirect_url": f"http://localhost:8000/?pago_exitoso=true&ref={reference}",
            "customer": {
                "email": customer_email,
                "full_name": customer_name,
                "phone": customer_phone or "3001234567"
            },
            "payment_methods": [
                {
                    "type": "PSE",
                    "label": "PSE (Débito Cuentas de Ahorro/Corriente todos los bancos)",
                    "icon": "🏦"
                },
                {
                    "type": "NEQUI",
                    "label": "Nequi (Push inmediato y confirmación en celular)",
                    "icon": "📱"
                },
                {
                    "type": "CARD",
                    "label": "Tarjeta de Crédito / Débito (Visa, Mastercard, Amex)",
                    "icon": "💳"
                },
                {
                    "type": "BANCOLOMBIA_QR",
                    "label": "Botón Bancolombia / Transferencia con Código QR",
                    "icon": "🟡"
                }
            ],
            # Construir parámetros limpios y codificados para Wompi Web Checkout
            # NOTA TÉCNICA: AWS CloudFront WAF bloquea con Error 403 Forbidden cualquier petición
            # que incluya 'redirect-url' apuntando a 'localhost' o 'http://' (reglas anti-SSRF de AWS).
            # Omitir redirect-url en local permite que Wompi cargue con HTTP 200 OK de inmediato.
            "checkout_url": "https://checkout.wompi.co/p/?" + urllib.parse.urlencode({
                "public-key": settings.NEXT_PUBLIC_WOMPI_PUBLIC_KEY,
                "currency": currency,
                "amount-in-cents": str(amount_in_cents),
                "reference": reference,
                "signature:integrity": signature,
                "customer-data:email": customer_email,
                "customer-data:full-name": customer_name,
                "customer-data:phone-number": customer_phone or "3101234567",
                "customer-data:phone-number-prefix": "+57"
            }),
            "created_at": datetime.utcnow().isoformat()
        }

    @classmethod
    def simulate_mock_payment_approval(cls, reference: str, method: str = "NEQUI") -> Dict[str, Any]:
        """
        Simulación para entorno local/sandbox que permite probar el flujo completo
        de monetización y desbloqueo del documento inmediatamente.
        """
        return {
            "reference": reference,
            "status": "APPROVED",
            "transaction_id": f"WMP-TX-{uuid.uuid4().hex[:8].upper()}",
            "payment_method": method,
            "message": "Pago aprobado satisfactoriamente a través de Wompi Sandbox.",
            "unlocked_features": [
                "Descarga de minuta en PDF / Word sin marcas de agua",
                "Certificado de radicación virtual",
                "Asignación de abogado especialista titular"
            ],
            "timestamp": datetime.utcnow().isoformat()
        }


    @staticmethod
    def verify_transaction_by_reference(reference: str) -> dict:
        """Consulta la transacción Wompi por referencia (llave privada).
        Devuelve {encontrado, estado, id} o {encontrado: False}."""
        public_key = settings.NEXT_PUBLIC_WOMPI_PUBLIC_KEY or ""
        private_key = settings.WOMPI_PRIVATE_KEY or ""
        if not private_key or not public_key:
            return {"encontrado": False, "estado": "sin_configuracion"}
        base = "https://production.wompi.co/v1" if (public_key or "").startswith("pub_prod_") else "https://sandbox.wompi.co/v1"
        import urllib.request
        import urllib.parse
        url = f"{base}/transactions?reference={urllib.parse.quote(reference)}"
        req = urllib.request.Request(url, headers={"Authorization": f"Bearer {private_key}", "Accept": "application/json"})
        try:
            with urllib.request.urlopen(req, timeout=15) as resp:
                data = __import__("json").loads(resp.read().decode("utf-8"))
                lista = data.get("data") or []
                tx = next((t for t in lista if t.get("reference") == reference), None)
                if not tx:
                    return {"encontrado": False, "estado": "no_encontrada"}
                return {"encontrado": True, "estado": str(tx.get("status", "")), "id": tx.get("id")}
        except Exception as e:
            return {"encontrado": False, "estado": f"error:{type(e).__name__}"}
