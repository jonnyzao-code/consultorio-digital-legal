"""Envío de alertas por WhatsApp usando Twilio."""
import os
from twilio.rest import Client


async def enviar_alerta_whatsapp(
    telefono: str,
    nombre: str,
    radicado: str,
    novedad: str,
) -> bool:
    """
    Envía una alerta de novedad judicial por WhatsApp.
    
    Args:
        telefono: Número de teléfono colombiano (ej: 3001234567 o +573001234567)
        nombre: Nombre del usuario
        radicado: Número de radicado del proceso
        novedad: Descripción de la novedad detectada
    
    Returns:
        True si se envió exitosamente, False en caso de error.
    """
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token  = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_WHATSAPP_FROM", "whatsapp:+14155238886")  # Sandbox default

    if not account_sid or not auth_token:
        print("⚠️ Credenciales Twilio no configuradas")
        return False

    # Normalizar número colombiano
    telefono = telefono.strip().replace(" ", "").replace("-", "")
    if telefono.startswith("0"):
        telefono = telefono[1:]
    if not telefono.startswith("+"):
        telefono = f"+57{telefono}" if not telefono.startswith("57") else f"+{telefono}"

    mensaje = (
        f"⚖️ *Consultorio Digital Legal*\n"
        f"━━━━━━━━━━━━━━━━\n\n"
        f"🔔 *Nueva novedad judicial*\n\n"
        f"Hola *{nombre}*, se detectó una actualización en tu proceso:\n\n"
        f"📋 *Radicado:* `{radicado}`\n\n"
        f"📌 *Novedad:*\n{novedad}\n\n"
        f"━━━━━━━━━━━━━━━━\n"
        f"👉 Ingresa a tu portal para ver el detalle completo:\n"
        f"https://consultoriodigital.co/procesos/{radicado}\n\n"
        f"_Responde STOP para dejar de recibir alertas_"
    )

    try:
        client = Client(account_sid, auth_token)
        message = client.messages.create(
            body=mensaje,
            from_=from_number,
            to=f"whatsapp:{telefono}",
        )
        print(f"✅ WhatsApp enviado a {telefono} — SID: {message.sid}")
        return True
    except Exception as e:
        print(f"❌ Error enviando WhatsApp: {e}")
        return False
