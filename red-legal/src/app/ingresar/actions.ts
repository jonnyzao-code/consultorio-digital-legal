"use server";

import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

// A dónde volver después de ingresar (solo rutas internas).
const interna = (v: FormDataEntryValue | null) => {
  const s = String(v ?? "");
  return /^\/(?!\/)/.test(s) ? s : null;
};

export async function enviarEnlace(_: string, form: FormData): Promise<string> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return "Correo inválido.";
  const origin = (await headers()).get("origin");
  const siguiente = interna(form.get("siguiente"));
  if (siguiente) (await cookies()).set("siguiente", siguiente, { maxAge: 3600, httpOnly: true, sameSite: "lax", path: "/" });
  const { error } = await (await supabaseServer()).auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${origin}/auth/callback`, shouldCreateUser: true },
  });
  return error ? "No pudimos enviar el enlace. Intenta de nuevo." : "Te enviamos un enlace de acceso a tu correo.";
}

export async function ingresarConClave(_: string, form: FormData): Promise<string> {
  const email = z.email().safeParse(form.get("email"));
  const clave = String(form.get("clave") ?? "");
  if (!email.success || !clave) return "Escribe tu correo y tu contraseña.";
  const { error } = await (await supabaseServer()).auth.signInWithPassword({ email: email.data, password: clave });
  if (error) return "Correo o contraseña incorrectos. Si aún no tienes contraseña, entra con el enlace y créala en Mi cuenta.";
  redirect(interna(form.get("siguiente")) ?? "/panel");
}
