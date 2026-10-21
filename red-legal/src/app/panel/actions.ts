"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { limpiarRadicado } from "@/lib/rama";
import { venceTermino } from "@/lib/terminos";
import { sincronizarCaso } from "@/lib/vigilancia";
import { supabaseServer } from "@/lib/supabase/server";

const hoy = () => new Date().toISOString().slice(0, 10);
// Campos vacíos del formulario se tratan como no enviados.
const campos = (form: FormData) => Object.fromEntries([...form].filter(([, v]) => v !== ""));

export async function crearCaso(form: FormData) {
  const datos = z
    .object({
      titulo: z.string().min(3),
      area: z.string().min(2),
      radicado: z
        .string()
        .transform(limpiarRadicado)
        .refine((r) => r.length === 21 || r.length === 23, "El radicado debe tener 23 dígitos (o 21 sin instancia).")
        .optional(),
      despacho: z.string().optional(),
    })
    .safeParse(campos(form));
  if (!datos.success) redirect(`/panel?error=${encodeURIComponent(datos.error.issues[0]?.message ?? "Datos inválidos")}`);
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("casos")
    .insert({ ...datos.data, abogado_id: auth.user!.id, estado: "en_curso", primera_respuesta_en: new Date().toISOString() })
    .select("id, radicado")
    .single();
  if (error) redirect(`/panel?error=${encodeURIComponent(error.message)}`);
  if (data.radicado) await sincronizarCaso(supabase, data);
  redirect(`/panel/casos/${data.id}`);
}

export async function agregarActuacion(casoId: string, form: FormData) {
  const datos = z.object({ fecha: z.iso.date(), descripcion: z.string().min(3) }).parse(campos(form));
  const { error } = await (await supabaseServer()).from("actuaciones").insert({ ...datos, caso_id: casoId });
  if (error) throw new Error(error.message);
  revalidatePath(`/panel/casos/${casoId}`);
}

export async function agregarTermino(casoId: string, form: FormData) {
  const datos = z
    .object({
      descripcion: z.string().min(3),
      desde: z.iso.date().default(hoy()),
      dias: z.coerce.number().int().min(1).max(365),
      judicial: z.string().optional(),
      urgente: z.string().optional(),
    })
    .parse(campos(form));
  const vence = venceTermino(datos.desde, datos.dias, datos.judicial === "on");
  const { error } = await (await supabaseServer())
    .from("terminos")
    .insert({ caso_id: casoId, descripcion: datos.descripcion, vence, urgente: datos.urgente === "on" });
  if (error) throw new Error(error.message);
  revalidatePath(`/panel/casos/${casoId}`);
}

export async function marcarCumplido(casoId: string, terminoId: string) {
  await (await supabaseServer()).from("terminos").update({ cumplido: true }).eq("id", terminoId);
  revalidatePath(`/panel/casos/${casoId}`);
}

export async function cambiarEstado(casoId: string, form: FormData) {
  const estado = z.enum(["en_curso", "en_espera", "cerrado"]).parse(form.get("estado"));
  await (await supabaseServer())
    .from("casos")
    .update({ estado, cerrado_en: estado === "cerrado" ? new Date().toISOString() : null })
    .eq("id", casoId);
  revalidatePath(`/panel/casos/${casoId}`);
}

export async function sincronizarRama(casoId: string) {
  const supabase = await supabaseServer();
  const { data: caso } = await supabase.from("casos").select("id, radicado").eq("id", casoId).single();
  if (caso) await sincronizarCaso(supabase, caso);
  revalidatePath(`/panel/casos/${casoId}`);
}

export async function cambiarVigilancia(casoId: string, vigilar: boolean) {
  const { error } = await (await supabaseServer()).from("casos").update({ vigilar }).eq("id", casoId);
  if (error) redirect(`/panel/casos/${casoId}?error=${encodeURIComponent(error.message)}`);
  revalidatePath(`/panel/casos/${casoId}`);
}

export async function guardarRadicado(casoId: string, form: FormData) {
  const radicado = limpiarRadicado(String(form.get("radicado") ?? ""));
  if (radicado.length !== 21 && radicado.length !== 23) {
    redirect(`/panel/casos/${casoId}?error=${encodeURIComponent("El radicado debe tener 23 dígitos (o 21 sin instancia).")}`);
  }
  const supabase = await supabaseServer();
  const { error } = await supabase.from("casos").update({ radicado }).eq("id", casoId);
  if (error) redirect(`/panel/casos/${casoId}?error=${encodeURIComponent(error.message)}`);
  await sincronizarCaso(supabase, { id: casoId, radicado });
  revalidatePath(`/panel/casos/${casoId}`);
}
