import Anthropic from "@anthropic-ai/sdk";
import { z } from "zod";
import { AREAS, AREA_IDS } from "./areas";

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

export async function orientar(mensajes: Mensaje[]): Promise<Triage> {
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
