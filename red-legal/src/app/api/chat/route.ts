import { NextResponse } from "next/server";
import { z } from "zod";
import { SISTEMA_CHAT, respuestaBasica } from "@/lib/chat";

const Body = z.object({
  mensajes: z.array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(800) })).min(1).max(20),
});

type Mensaje = z.infer<typeof Body>["mensajes"][number];

// El plan gratis de Gemini responde 429/503 cuando está saturado: un reintento y luego el modelo de respaldo.
async function preguntarGemini(mensajes: Mensaje[]): Promise<string | undefined> {
  const modelos = [process.env.GEMINI_MODEL ?? "gemini-3.8-flash", process.env.GEMINI_MODEL_RESPALDO].filter(Boolean) as string[];
  let ultimo: unknown;
  for (const modelo of modelos) {
    for (let intento = 0; intento < 2; intento++) {
      const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${modelo}:generateContent`, {
        method: "POST",
        headers: { "Content-Type": "application/json", "x-goog-api-key": process.env.GEMINI_API_KEY! },
        signal: AbortSignal.timeout(30_000),
        body: JSON.stringify({
          systemInstruction: { parts: [{ text: SISTEMA_CHAT }] },
          contents: mensajes.map((m) => ({ role: m.role === "assistant" ? "model" : "user", parts: [{ text: m.content }] })),
          // Los modelos 3.x gastan parte del límite razonando: margen amplio para que la respuesta no salga cortada.
          generationConfig: { maxOutputTokens: 4096 },
        }),
      });
      if (res.ok) {
        const data = await res.json();
        return data.candidates?.[0]?.content?.parts?.map((p: { text?: string }) => p.text ?? "").join("").trim();
      }
      ultimo = new Error(`Gemini (${modelo}) respondió ${res.status}`);
      if (res.status !== 429 && res.status !== 503) break;
      await new Promise((r) => setTimeout(r, 1500));
    }
  }
  throw ultimo;
}

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) return NextResponse.json({ error: "La conversación es demasiado larga. Recarga para empezar otra." }, { status: 400 });
  // Gemini exige que la conversación empiece con el usuario.
  const mensajes = parsed.data.mensajes.slice(parsed.data.mensajes.findIndex((m) => m.role === "user"));
  const ultima = mensajes.at(-1)!.content;
  if (!process.env.GEMINI_API_KEY) return NextResponse.json({ respuesta: respuestaBasica(ultima) });

  try {
    const respuesta = await preguntarGemini(mensajes);
    return NextResponse.json({ respuesta: respuesta || respuestaBasica(ultima) });
  } catch (e) {
    console.error("Chat sin IA:", e);
    return NextResponse.json({ respuesta: respuestaBasica(ultima) });
  }
}
