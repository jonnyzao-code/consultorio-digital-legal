import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type UsuarioAdmin = {
  id: string;
  email: string | null;
  nombre_completo: string;
  documento: string;
  telefono: string;
  ciudad: string;
  plan: "free" | "pago";
  procesos: number;
};

async function exigirAdmin(context: any) {
  const { data } = await context.supabase
    .from("user_roles")
    .select("role")
    .eq("user_id", context.userId)
    .eq("role", "admin")
    .maybeSingle();
  if (!data) throw new Error("Solo el administrador puede hacer esto.");
}

export const listarUsuarios = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<UsuarioAdmin[]> => {
    await exigirAdmin(context);
    const { data: perfiles, error } = await context.supabase
      .from("profiles")
      .select("id, email, nombre_completo, documento, telefono, ciudad, plan")
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    const { data: procesos } = await context.supabase
      .from("procesos")
      .select("user_id");
    const conteo = new Map<string, number>();
    for (const p of procesos ?? []) {
      conteo.set(p.user_id, (conteo.get(p.user_id) ?? 0) + 1);
    }
    return (perfiles ?? []).map((p: any) => ({
      ...p,
      procesos: conteo.get(p.id) ?? 0,
    }));
  });

export const cambiarPlan = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { userId: string; plan: "free" | "pago" }) => input)
  .handler(async ({ data, context }) => {
    await exigirAdmin(context);
    const { error } = await context.supabase
      .from("profiles")
      .update({ plan: data.plan })
      .eq("id", data.userId);
    if (error) throw new Error(error.message);

    if (data.plan === "pago") {
      const hasta = new Date(Date.now() + 30 * 86400000).toISOString();
      await context.supabase
        .from("procesos")
        .update({ vigente_hasta: hasta })
        .eq("user_id", data.userId);
    }
    return { ok: true };
  });
