import { MINUTAS } from "./minutas";
import { pesos, precioMinuta } from "./minutas/precios";
import { PLANES } from "./planes";

export type MensajeChat = { role: "user" | "assistant"; content: string };

const CONOCIMIENTO = `Servicios de Red Legal DOMINET (abogados.dominetsas.com), de DOMINET S.A.S.:
- Orientación legal preliminar con IA, gratis: /orientacion. Identifica el área del derecho y la urgencia. No es concepto jurídico.
- Concepto preliminar firmado por un abogado inscrito: $39.900 más IVA, se pide desde /orientacion.
- Remisión a abogados verificados según área, ciudad, costo y calificación.
- Minutas y formatos jurídicos de pago, con acceso por 30 días, en /minutas:
${MINUTAS.map((m) => `  · ${m.titulo}: ${pesos(precioMinuta(m.id))} (/minutas/${m.id})`).join("\n")}
- Planes para abogados (/planes, más IVA, anual con 2 meses gratis, fundadores 50% por 6 meses):
${PLANES.map((p) => `  · ${p.nombre} ${p.precio}: ${p.servicios.join("; ")}`).join("\n")}
- Abogados: inscripción en /abogados/registro (se verifica la tarjeta profesional) y contrato en /terminos/abogados.
- Ingreso con enlace al correo en /ingresar. Datos personales: /terminos/datos. Contacto: dominetsas@gmail.com.
- Pagos con Wompi: PSE, Nequi, tarjetas.`;

export const SISTEMA_CHAT = `Eres el asistente virtual de Red Legal DOMINET. Respondes en español de Colombia, con frases cortas y amables (máximo 5 frases o una lista breve).
Ayudas a los visitantes a entender y usar los servicios, y los llevas a la página correcta escribiendo la ruta (por ejemplo /orientacion o /minutas/accion-de-tutela).
Sobre problemas legales concretos: no des asesoría ni estrategia; explica en términos generales y recomienda la orientación gratuita en /orientacion o un abogado de la red.
Si hay riesgo para la vida o la integridad, indica llamar al 123. Nunca pidas números de documento ni datos sensibles. No inventes precios ni servicios que no estén en esta información.

${CONOCIMIENTO}`;

// Respuestas sin IA cuando Gemini no está disponible.
const FAQ: [RegExp, string][] = [
  [/precio|cu[aá]nto|vale|cuesta|plan/i, "Los planes para abogados van desde $49.900/mes (/planes). Las minutas cuestan entre $9.900 y $24.900 (/minutas). La orientación con IA es gratis (/orientacion)."],
  [/minuta|formato|contrato|tutela|petici[oó]n|pagar[eé]|letra/i, "En /minutas encuentras 17 formatos: derechos de petición, tutelas, acciones populares y de grupo, contratos, pagarés y más. Los llenas en línea y los descargas en Word o PDF."],
  [/abogad|inscrib|registr/i, "Si eres abogado, revisa los planes en /planes e inscríbete en /abogados/registro. Verificamos tu tarjeta profesional antes de activar tu perfil."],
  [/proceso|radicado|rama/i, "Los abogados inscritos vigilan sus procesos de la Rama Judicial desde su panel: les avisamos por correo cada actuación nueva (/planes)."],
];

export function respuestaBasica(pregunta: string) {
  return (
    FAQ.find(([re]) => re.test(pregunta))?.[1] ??
    "Puedo ayudarte con la orientación legal gratuita (/orientacion), las minutas y formatos (/minutas) o los planes para abogados (/planes). ¿Qué necesitas?"
  );
}
