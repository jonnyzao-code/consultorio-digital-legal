import { NextResponse } from "next/server";
import { z } from "zod";
import { orientar } from "@/lib/triage";

const Body = z.object({
  mensajes: z
    .array(z.object({ role: z.enum(["user", "assistant"]), content: z.string().min(1).max(4000) }))
    .min(1)
    .max(12),
  autoriza_datos: z.literal(true),
});

export async function POST(req: Request) {
  const parsed = Body.safeParse(await req.json().catch(() => null));
  if (!parsed.success) {
    return NextResponse.json({ error: "Solicitud inválida o sin autorización de datos" }, { status: 400 });
  }
  try {
    const triage = await orientar(parsed.data.mensajes);
    return NextResponse.json(triage);
  } catch (e) {
    console.error(e);
    return NextResponse.json({ error: "No fue posible generar la orientación" }, { status: 502 });
  }
}
