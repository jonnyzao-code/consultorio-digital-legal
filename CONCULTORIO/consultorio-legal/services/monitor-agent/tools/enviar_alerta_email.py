"""Envío de alertas por email usando SendGrid."""
import os
from sendgrid import SendGridAPIClient
from sendgrid.helpers.mail import Mail, To, Email, Content, HtmlContent


def enviar_alerta_email(
    destinatario: str,
    nombre: str,
    numero_radicado: str,
    novedad: str,
    url_detalle: str,
) -> bool:
    """
    Envía una alerta de novedad judicial por correo electrónico.
    
    Returns:
        True si se envió exitosamente, False en caso de error.
    """
    api_key = os.getenv("SENDGRID_API_KEY")
    if not api_key:
        print("⚠️ SENDGRID_API_KEY no configurada")
        return False

    html_body = f"""
    <!DOCTYPE html>
    <html lang="es">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="font-family: Arial, sans-serif; background: #f4f4f4; margin: 0; padding: 20px;">
      <div style="max-width: 600px; margin: 0 auto; background: white; border-radius: 12px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
        <!-- Header -->
        <div style="background: #1e3a5f; padding: 24px 32px;">
          <h1 style="color: #c9a84c; margin: 0; font-size: 20px;">⚖️ Consultorio Digital Legal</h1>
          <p style="color: rgba(255,255,255,0.8); margin: 4px 0 0; font-size: 14px;">Sistema de Monitoreo Judicial</p>
        </div>
        
        <!-- Alerta -->
        <div style="padding: 32px;">
          <div style="background: #fff3cd; border: 1px solid #ffc107; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
            <p style="margin: 0; font-size: 16px; font-weight: bold; color: #856404;">🔔 Nueva novedad en tu proceso</p>
          </div>
          
          <p style="color: #374151; font-size: 16px;">Hola <strong>{nombre}</strong>,</p>
          <p style="color: #6b7280;">Se detectó una novedad en el proceso judicial que estás monitoreando:</p>
          
          <div style="background: #f9fafb; border-left: 4px solid #1e3a5f; padding: 16px; border-radius: 0 8px 8px 0; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.05em;">Número de Radicado</p>
            <p style="margin: 0; font-weight: bold; color: #1e3a5f; font-size: 18px; font-family: monospace;">{numero_radicado}</p>
          </div>
          
          <div style="background: #f0fdf4; border: 1px solid #bbf7d0; border-radius: 8px; padding: 16px; margin: 20px 0;">
            <p style="margin: 0 0 8px; font-size: 12px; color: #15803d; text-transform: uppercase; letter-spacing: 0.05em;">Novedad detectada</p>
            <p style="margin: 0; color: #166534; font-size: 15px;">{novedad}</p>
          </div>
          
          <div style="text-align: center; margin: 32px 0;">
            <a href="{url_detalle}" 
               style="background: #1e3a5f; color: white; text-decoration: none; padding: 14px 28px; border-radius: 8px; font-weight: bold; font-size: 15px; display: inline-block;">
              Ver detalle del proceso →
            </a>
          </div>
          
          <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 24px 0;">
          <p style="color: #9ca3af; font-size: 12px; text-align: center;">
            Este correo fue enviado automáticamente por el Sistema de Monitoreo Judicial.<br>
            Cumplimiento Ley 1581 de 2012 · <a href="#" style="color: #1e3a5f;">Cancelar suscripción</a>
          </p>
        </div>
      </div>
    </body>
    </html>
    """

    message = Mail(
        from_email=Email("alertas@consultoriodigital.co", "Consultorio Digital Legal"),
        to_emails=To(destinatario, nombre),
        subject=f"🔔 Novedad en tu proceso judicial — Radicado {numero_radicado}",
        html_content=HtmlContent(html_body),
    )

    try:
        sg = SendGridAPIClient(api_key)
        response = sg.send(message)
        success = response.status_code in (200, 202)
        if success:
            print(f"✅ Email enviado a {destinatario} (status {response.status_code})")
        return success
    except Exception as e:
        print(f"❌ Error enviando email: {e}")
        return False
