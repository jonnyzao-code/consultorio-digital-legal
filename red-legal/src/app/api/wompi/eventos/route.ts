import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { DIAS_ACCESO_MINUTA } from "@/lib/minutas/precios";
import { hoyMas } from "@/lib/terminos";
import { ESTADOS, eventoValido, type EventoWompi } from "@/lib/wompi";

export async function POST(req: Request) {
  const evento = (await req.json().catch(() => null)) as EventoWompi | null;
  if (!evento?.signature || !eventoValido(evento)) return NextResponse.json({ error: "Firma inválida" }, { status: 401 });
  if (evento.event !== "transaction.updated") return NextResponse.json({ ok: true });

  const tx = evento.data.transaction;
  const estado = ESTADOS[tx.status];
  if (!estado) return NextResponse.json({ ok: true });

  const db = supabaseAdmin();
  // Solo se procesa la transición desde pendiente: así los reintentos de Wompi no duplican efectos.
  const { data: pago } = await db
    .from("pagos")
    .update({ estado, wompi_id: tx.id, actualizado_en: new Date().toISOString() })
    .eq("referencia", tx.reference)
    .eq("estado", "pendiente")
    .eq("monto_centavos", tx.amount_in_cents)
    .select("*")
    .maybeSingle();
  if (!pago || estado !== "aprobado") return NextResponse.json({ ok: true });

  if (pago.tipo === "suscripcion") {
    const { data: ultima } = await db
      .from("suscripciones")
      .select("vigente_hasta")
      .eq("abogado_id", pago.perfil_id)
      .order("vigente_hasta", { ascending: false })
      .limit(1)
      .maybeSingle();
    const hoy = new Date().toISOString().slice(0, 10);
    const inicio = new Date(`${ultima && ultima.vigente_hasta > hoy ? ultima.vigente_hasta : hoy}T00:00:00Z`);
    if (pago.periodicidad === "anual") inicio.setUTCFullYear(inicio.getUTCFullYear() + 1);
    else inicio.setUTCMonth(inicio.getUTCMonth() + 1);
    await db.from("suscripciones").insert({
      abogado_id: pago.perfil_id,
      plan: pago.plan,
      periodicidad: pago.periodicidad,
      valor_cop: pago.monto_centavos / 100,
      descuento_pct: pago.descuento_pct,
      vigente_hasta: inicio.toISOString().slice(0, 10),
      referencia_pasarela: tx.id,
    });
    await db.from("abogados").update({ plan: pago.plan }).eq("id", pago.perfil_id);
  } else if (pago.tipo === "minuta") {
    await db.from("accesos_minutas").insert({
      perfil_id: pago.perfil_id,
      minuta_id: pago.minuta_id,
      origen: "pago",
      pago_id: pago.id,
      vence: hoyMas(DIAS_ACCESO_MINUTA),
    });
  } else if (pago.consulta_id) {
    await db.from("consultas").update({ concepto_pagado: true }).eq("id", pago.consulta_id);
  }
  return NextResponse.json({ ok: true });
}
