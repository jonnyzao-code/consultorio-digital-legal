"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { minuta } from "@/lib/minutas";
import { precioMinuta } from "@/lib/minutas/precios";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { nuevaReferencia, urlCheckout } from "@/lib/wompi";

async function usuario(minutaId: string) {
  if (!minuta(minutaId)) redirect("/minutas");
  const supabase = await supabaseServer();
  const { data } = await supabase.auth.getUser();
  if (!data.user) redirect(`/ingresar?siguiente=/minutas/${minutaId}`);
  return { supabase, user: data.user };
}

export async function usarPlan(minutaId: string) {
  const { supabase } = await usuario(minutaId);
  const { data: error } = await supabase.rpc("usar_cupo_minuta", { minuta: minutaId });
  redirect(`/minutas/${minutaId}${error ? `?error=${encodeURIComponent(error)}` : ""}`);
}

export async function pagarMinuta(minutaId: string) {
  const { user } = await usuario(minutaId);
  const referencia = nuevaReferencia("MIN");
  // Las minutas tienen precio final con IVA incluido.
  const monto = precioMinuta(minutaId) * 100;
  const { error } = await supabaseAdmin()
    .from("pagos")
    .insert({ referencia, tipo: "minuta", perfil_id: user.id, minuta_id: minutaId, monto_centavos: monto });
  if (error) throw new Error(error.message);
  const origen = (await headers()).get("origin");
  redirect(urlCheckout({ referencia, montoCentavos: monto, email: user.email, redirect: `${origen}/minutas/${minutaId}?pago=1` }));
}
