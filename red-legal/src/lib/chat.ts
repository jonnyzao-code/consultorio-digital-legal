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

// Respuestas sin IA cuando Gemini no está disponible: primero una minuta concreta, luego por tema.
const FAQ: [RegExp, string][] = [
  [/abogad|inscrib|registr/i, "Si eres abogado, revisa los planes en /planes e inscríbete en /abogados/registro. Verificamos tu tarjeta profesional antes de activar tu perfil."],
  [/proceso|radicado|rama|actuaci/i, "Los abogados inscritos vigilan sus procesos de la Rama Judicial desde su panel: les avisamos por correo cada actuación nueva y los términos por vencer (/planes)."],
  [/plan|suscrip|mensual/i, "Planes para abogados: Básico $49.900/mes, Profesional $99.900/mes y Firma $249.900/mes, con vigilancia de procesos y minutas incluidas (/planes)."],
  [/minuta|formato|modelo|plantilla|documento/i, `En /minutas encuentras ${MINUTAS.length} formatos: derechos de petición, tutelas, acciones populares y de grupo, contratos, pagarés y más. Desde $9.900; los llenas en línea y los descargas en Word o PDF.`],
  [/precio|cu[aá]nto|vale|cuesta|costo/i, "La orientación con IA es gratis (/orientacion). Las minutas cuestan entre $9.900 y $24.900 (/minutas) y los planes para abogados desde $49.900/mes (/planes)."],
  [/ingres|contrase|clave|cuenta|acceso/i, "Ingresa en /ingresar con tu correo y contraseña, o pide un enlace de acceso a tu correo. Puedes crear o cambiar la contraseña en /panel/cuenta."],
  [/pago|pagar|wompi|nequi|pse|tarjeta/i, "Los pagos se hacen con Wompi: PSE, Nequi o tarjeta. Al confirmarse el pago, la minuta o el plan se activan de inmediato."],
  [/problema|demanda|despid|divorc|deuda|herencia|arriend|caso|ayuda legal/i, "Cuéntanos tu caso en /orientacion: es gratis y en minutos te decimos el área del derecho, la urgencia y los siguientes pasos. Si lo necesitas, un abogado de la red te atiende."],
];

const sinTildes = (t: string) => t.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Busca una minuta nombrada en la pregunta (p. ej. "pagaré" o "tutela"). */
function minutaMencionada(pregunta: string) {
  const q = sinTildes(pregunta);
  const comunes = new Set(["accion", "contrato", "derecho", "termino", "especial"]);
  const puntaje = (id: string) => id.split("-").filter((p) => p.length > 4 && !comunes.has(p) && q.includes(p)).length;
  return MINUTAS.map((m) => ({ m, n: puntaje(m.id) })).filter((x) => x.n > 0).sort((a, b) => b.n - a.n)[0]?.m;
}

export function respuestaBasica(pregunta: string) {
  const m = minutaMencionada(pregunta);
  if (m) return `${m.titulo}: cuesta ${pesos(precioMinuta(m.id))} (IVA incluido, acceso por 30 días) y está incluida en los planes para abogados. La llenas en línea y la descargas en Word o PDF: /minutas/${m.id}`;
  return (
    FAQ.find(([re]) => re.test(pregunta))?.[1] ??
    "Puedo ayudarte con la orientación legal gratuita (/orientacion), las minutas y formatos (/minutas) o los planes para abogados (/planes). ¿Qué necesitas?"
  );
}
