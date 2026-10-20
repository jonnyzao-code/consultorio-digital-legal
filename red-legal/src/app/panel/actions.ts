"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { z } from "zod";
import { venceTermino } from "@/lib/terminos";
import { supabaseServer } from "@/lib/supabase/server";

const hoy = () => new Date().toISOString().slice(0, 10);
// Campos vacíos del formulario se tratan como no enviados.
const campos = (form: FormData) => Object.fromEntries([...form].filter(([, v]) => v !== ""));

export async function crearCaso(form: FormData) {
  const datos = z
    .object({ titulo: z.string().min(3), area: z.string().min(2), radicado: z.string().optional(), despacho: z.string().optional() })
    .parse(campos(form));
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const { data, error } = await supabase
    .from("casos")
    .insert({ ...datos, abogado_id: auth.user!.id, estado: "en_curso", primera_respuesta_en: new Date().toISOString() })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
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
