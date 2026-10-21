import "server-only";

// Correos de la app (alertas de términos y actuaciones). Brevo: dominetsas.com ya está verificado allí.
// Si solo existe RESEND_API_KEY se usa Resend.
const REMITENTE = { name: "Red Legal DOMINET", email: process.env.ALERTAS_REMITENTE ?? "alertas@dominetsas.com" };

export async function enviarCorreo({ para, asunto, texto }: { para: string; asunto: string; texto: string }): Promise<boolean> {
  if (process.env.BREVO_API_KEY) {
    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: { "api-key": process.env.BREVO_API_KEY, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ sender: REMITENTE, to: [{ email: para }], subject: asunto, textContent: texto }),
    });
    if (!res.ok) console.error("Brevo respondió", res.status, await res.text());
    return res.ok;
  }
  if (process.env.RESEND_API_KEY) {
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from: `${REMITENTE.name} <${REMITENTE.email}>`, to: para, subject: asunto, text: texto }),
    });
    return res.ok;
  }
  console.error("Sin BREVO_API_KEY ni RESEND_API_KEY: no se envió el correo", asunto);
  return false;
}
