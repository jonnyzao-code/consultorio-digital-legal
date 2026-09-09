"""
Correo transaccional: confirmación de cuenta y restablecimiento de contraseña.
Modo real: SMTP (SMTP_HOST/PORT/USER/PASSWORD). Modo dev sin SMTP: el enlace
viaja en la respuesta (dev_link) para poder probar el flujo completo.
"""
import re
import smtplib
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import structlog
from app.core.config import settings

log = structlog.get_logger()


def send_mail(to_email: str, subject: str, html_body: str) -> dict:
    smtp_host = getattr(settings, "SMTP_HOST", "") or ""
    smtp_user = getattr(settings, "SMTP_USER", "") or ""
    if not smtp_host or not smtp_user:
        m = re.search(r'http[^"\'<>\s]+', html_body)
        log.info("MAIL_DEBUG (SMTP no configurado) -> " + to_email + " :: " + subject)
        return {
            "sent": False,
            "dev_link": m.group(0) if m else None,
            "error": None if settings.ENVIRONMENT.lower() in ("development", "dev", "demo") else "SMTP no configurado (producción)",
        }
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = settings.EMAIL_FROM or (smtp_user if "@" in smtp_user else "noreply@consultoriodigitallegal.co")
        msg["To"] = to_email
        msg.attach(MIMEText(html_body, "html", "utf-8"))
        port = int(getattr(settings, "SMTP_PORT", 587) or 587)
        with smtplib.SMTP(smtp_host, port, timeout=20) as server:
            server.ehlo()
            try:
                server.starttls()
            except Exception:
                pass
            if smtp_user and getattr(settings, "SMTP_PASSWORD", ""):
                server.login(smtp_user, settings.SMTP_PASSWORD)
            server.sendmail(msg["From"], [to_email], msg.as_string())
        return {"sent": True, "dev_link": None, "error": None}
    except Exception as e:
        log.warning("Fallo al enviar correo: %s", e)
        return {"sent": False, "dev_link": None, "error": str(e)}
