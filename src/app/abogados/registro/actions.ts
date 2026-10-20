"use server";

import { z } from "zod";
import { AREA_IDS } from "@/lib/areas";
import { supabaseAdmin } from "@/lib/supabase/admin";

const Solicitud = z.object({
  nombre: z.string().min(5).max(120),
  email: z.email(),
  telefono: z.string().min(7).max(20),
  ciudad: z.string().min(2).max(60),
  tarjeta_profesional: z.string().regex(/^\d{3,7}$/, "Número de tarjeta inválido"),
  areas: z.array(z.enum(AREA_IDS)).min(1).max(3),
  plan: z.enum(["basico", "profesional", "firma"]),
  codigo_referido: z.string().max(20).optional(),
  acepta_contrato: z.literal("on"),
  autoriza_datos: z.literal("on"),
});

export type Estado = { ok: boolean; mensaje: string };

export async function registrarAbogado(_: Estado, form: FormData): Promise<Estado> {
  const parsed = Solicitud.safeParse({
    ...Object.fromEntries(form),
    areas: form.getAll("areas"),
    codigo_referido: form.get("codigo_referido") || undefined,
  });
  if (!parsed.success) return { ok: false, mensaje: parsed.error.issues[0]?.message ?? "Datos inválidos" };

  const { nombre, email, telefono, ciudad, tarjeta_profesional, areas, plan, codigo_referido } = parsed.data;
  const { error } = await supabaseAdmin()
    .from("solicitudes_abogados")
    .insert({ nombre, email, telefono, ciudad, tarjeta_profesional, areas, plan, codigo_referido });
  if (error) {
    if (error.code === "23505") return { ok: false, mensaje: "Ya existe una solicitud con ese correo o tarjeta profesional." };
    console.error(error);
    return { ok: false, mensaje: "No pudimos guardar la solicitud. Intenta de nuevo." };
  }
  return { ok: true, mensaje: "Recibimos tu solicitud. Verificaremos tu tarjeta profesional y te escribiremos en máximo 2 días hábiles." };
}
