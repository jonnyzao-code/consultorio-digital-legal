"use server";

import { headers } from "next/headers";
import { z } from "zod";
import { supabaseServer } from "@/lib/supabase/server";

export async function enviarEnlace(_: string, form: FormData): Promise<string> {
  const email = z.email().safeParse(form.get("email"));
  if (!email.success) return "Correo inválido.";
  const origin = (await headers()).get("origin");
  const { error } = await (await supabaseServer()).auth.signInWithOtp({
    email: email.data,
    options: { emailRedirectTo: `${origin}/auth/callback`, shouldCreateUser: true },
  });
  return error ? "No pudimos enviar el enlace. Intenta de nuevo." : "Te enviamos un enlace de acceso a tu correo.";
}
