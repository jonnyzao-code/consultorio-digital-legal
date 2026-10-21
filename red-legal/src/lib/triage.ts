import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AREAS, AREA_IDS } from "./areas";
import { orientarBasico } from "./triage-basico";

export const TriageSchema = z.object({
  areas: z.array(z.enum(AREA_IDS)).min(1).max(3),
  urgencia: z.enum(["alta", "media", "baja"]),
  motivo_urgencia: z.string(),
  resumen: z.string(),
  preguntas_pendientes: z.array(z.string()).max(5),
  orientacion_general: z.array(z.string()).max(6),
  requiere_abogado: z.boolean(),
});
export type Triage = z.infer<typeof TriageSchema>;
// Indica si la orientación vino de la IA o de la clasificación básica por palabras clave.
export type Orientacion = Triage & { origen: "ia" | "basica" };

export type Mensaje = { role: "user" | "assistant"; content: string };

const SYSTEM = `Eres el asistente de orientación de Red Legal DOMINET, una plataforma colombiana que conecta personas con abogados inscritos.
Tu tarea es entender la necesidad del usuario y clasificarla; no das conceptos jurídicos ni garantizas resultados.
Reglas:
- Responde siempre en español claro, sin tecnicismos innecesarios.
- Clasifica el caso en 1 a 3 de estas áreas: ${AREAS.map((a) => `${a.id} (${a.ejemplos})`).join("; ")}.
- Urgencia alta: términos que vencen en días, capturas, desalojos inminentes, violencia, salud o menores en riesgo. Media: hay plazo pero corre. Baja: planeación o dudas generales.
- Si hay riesgo para la vida o integridad, indica en la orientación llamar a la línea 123 o acudir a la Fiscalía o Comisaría de Familia.
- La orientación general son pasos prudentes (reunir documentos, no firmar, guardar pruebas), nunca estrategia procesal concreta.
- No pidas ni repitas datos sensibles innecesarios (números de documento, historias clínicas).
- Usa siempre la herramienta registrar_orientacion.`;

const tool: Anthropic.Tool = {
  name: "registrar_orientacion",
  description: "Registra la clasificación y orientación preliminar del caso.",
  input_schema: {
    type: "object",
    properties: {
      areas: { type: "array", items: { type: "string", enum: AREA_IDS }, minItems: 1, maxItems: 3 },
      urgencia: { type: "string", enum: ["alta", "media", "baja"] },
      motivo_urgencia: { type: "string" },
      resumen: { type: "string", description: "Resumen neutral del caso en 2 a 4 frases." },
      preguntas_pendientes: { type: "array", items: { type: "string" }, maxItems: 5, description: "Datos que faltan para un concepto." },
      orientacion_general: { type: "array", items: { type: "string" }, maxItems: 6 },
      requiere_abogado: { type: "boolean" },
    },
    required: ["areas", "urgencia", "motivo_urgencia", "resumen", "preguntas_pendientes", "orientacion_general", "requiere_abogado"],
  },
};

export async function orientar(mensajes: Mensaje[]): Promise<Orientacion> {
  // Orden: Gemini (plan gratuito) si hay clave, luego Claude; si ninguna IA responde, clasificación básica gratuita.
  if (process.env.GEMINI_API_KEY) {
    try {
      return { ...(await orientarConGemini(mensajes)), origen: "ia" };
    } catch (e) {
      console.error("Gemini no disponible:", e);
    }
  }
  if (process.env.ANTHROPIC_API_KEY) {
    try {
      return { ...(await orientarConClaude(mensajes)), origen: "ia" };
    } catch (e) {
      console.error("Claude no disponible:", e);
    }
  }
  return { ...orientarBasico(mensajes), origen: "basica" };
}

async function orientarConClaude(mensajes: Mensaje[]): Promise<Triage> {
  const client = new Anthropic();
  const res = await client.messages.create({
    model: process.env.ANTHROPIC_MODEL ?? "claude-sonnet-5-5",
    max_tokens: 1500,
    system: SYSTEM,
    tools: [tool],
    tool_choice: { type: "tool", name: tool.name },
    messages: mensajes,
  });
  const block = res.content.find((b) => b.type === "tool_use");
  if (!block || block.type !== "tool_use") throw new Error("La IA no devolvió una orientación");
  return TriageSchema.parse(block.input);
}

const texto = { type: "STRING" };
const lista = (max: number, items: object = texto) => ({ type: "ARRAY", items, maxItems: max });

async function orientarConGemini(mensajes: Mensaje[]): Promise<Triage> {
  const modelo = process.env.GEMINI_MODEL ?? "gemini-3.8-flash";
  const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
    body: JSON.stringify({
      systemInstruction: { parts: [{ text: SYSTEM.replace("Usa siempre la herramienta registrar_orientacion.", "Responde solo con el JSON pedido.") }] },
      contents: mensajes.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
      generationConfig: {
        responseMimeType: "application/json",
        responseSchema: {
          type: "OBJECT",
          properties: {
            areas: { ...lista(3, { type: "STRING", enum: AREA_IDS }), minItems: 1 },
            urgencia: { type: "STRING", enum: ["alta", "media", "baja"] },
            motivo_urgencia: texto,
            resumen: texto,
            preguntas_pendientes: lista(5),
            orientacion_general: lista(6),
            requiere_abogado: { type: "BOOLEAN" },
          },
          required: ["areas", "urgencia", "motivo_urgencia", "resumen", "preguntas_pendientes", "orientacion_general", "requiere_abogado"],
        },
      },
    }),
  });
  if (!res.ok) throw new Error(`Gemini respondió ${res.status}: ${(await res.text()).slice(0, 300)}`);
  const data = await res.json();
  const salida = data.candidates?.[0]?.content?.parts?.[0]?.text;
  if (!salida) throw new Error("La IA no devolvió una orientación");
  return TriageSchema.parse(JSON.parse(salida));
}
