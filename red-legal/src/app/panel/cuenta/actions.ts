"use server";

import { supabaseServer } from "@/lib/supabase/server";

export async function cambiarClave(_: string, form: FormData): Promise<string> {
  const clave = String(form.get("clave") ?? "");
  if (clave.length < 8) return "La contraseña debe tener al menos 8 caracteres.";
  if (clave !== String(form.get("confirmar") ?? "")) return "Las contraseñas no coinciden.";
  const { error } = await (await supabaseServer()).auth.updateUser({ password: clave });
  return error ? `No se pudo guardar: ${error.message}` : "Listo: desde ahora puedes ingresar con tu correo y esta contraseña.";
}
