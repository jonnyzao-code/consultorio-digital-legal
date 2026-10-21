"use server";

import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { TriageSchema, type Triage } from "@/lib/triage";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";
import { PRECIO_CONCEPTO, PRECIOS, nuevaReferencia, totalCentavos, urlCheckout } from "@/lib/wompi";

const retorno = async () => `${(await headers()).get("origin")}/pagos/resultado`;

async function usuario() {
  const { data } = await (await supabaseServer()).auth.getUser();
  if (!data.user) redirect("/ingresar");
  return data.user;
}

export async function pagarSuscripcion(form: FormData) {
  const { plan, periodicidad } = z
    .object({ plan: z.enum(["basico", "profesional", "firma"]), periodicidad: z.enum(["mensual", "anual"]) })
    .parse(Object.fromEntries(form));
  const user = await usuario();
  const db = supabaseAdmin();
  const { data: abogado } = await db.from("abogados").select("id").eq("id", user.id).maybeSingle();
  if (!abogado) throw new Error("Solo abogados aprobados pueden suscribirse");

  // Promoción de fundadores: 50% en los primeros 6 pagos mensuales.
  const fundador = process.env.PROMO_FUNDADORES === "true" && periodicidad === "mensual";
  const { count } = await db.from("suscripciones").select("id", { count: "exact", head: true }).eq("abogado_id", user.id);
  const descuento = fundador && (count ?? 0) < 6 ? 50 : 0;

  const referencia = nuevaReferencia("SUS");
  const monto = totalCentavos(PRECIOS[plan][periodicidad], descuento);
  const { error } = await db.from("pagos").insert({
    referencia, tipo: "suscripcion", perfil_id: user.id, plan, periodicidad, monto_centavos: monto, descuento_pct: descuento,
  });
  if (error) throw new Error(error.message);
  redirect(urlCheckout({ referencia, montoCentavos: monto, email: user.email, redirect: await retorno() }));
}

export async function pagarConcepto(triage: Triage) {
  const t = TriageSchema.parse(triage);
  const user = await usuario();
  const db = supabaseAdmin();
  const { data: consulta, error } = await db
    .from("consultas")
    .insert({ cliente_id: user.id, areas: t.areas, urgencia: t.urgencia, resumen: t.resumen, orientacion: t })
    .select("id")
    .single();
  if (error) throw new Error(error.message);
  const referencia = nuevaReferencia("CON");
  const monto = totalCentavos(PRECIO_CONCEPTO);
  await db.from("pagos").insert({ referencia, tipo: "concepto", perfil_id: user.id, consulta_id: consulta.id, monto_centavos: monto });
  redirect(urlCheckout({ referencia, montoCentavos: monto, email: user.email, redirect: await retorno() }));
}
