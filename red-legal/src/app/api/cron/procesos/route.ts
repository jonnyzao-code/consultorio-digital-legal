import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { sincronizarCaso } from "@/lib/vigilancia";

// Revisa en la Rama Judicial los procesos vigilados que no se han consultado en las últimas 20 horas.
// Trabaja por lotes pequeños (Cloudflare limita las conexiones por solicitud): el NUC lo llama cada 15 minutos.
export async function GET(req: Request) {
  if (req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const lote = Math.min(Number(new URL(req.url).searchParams.get("lote") ?? 4) || 4, 20);
  const db = supabaseAdmin();
  const antes = new Date(Date.now() - 20 * 3_600_000).toISOString();
  const { data: casos, error } = await db
    .from("casos")
    .select("id, titulo, radicado, abogado_id, rama_consultado_en")
    .eq("vigilar", true)
    .neq("estado", "cerrado")
    .not("radicado", "is", null)
    .or(`rama_consultado_en.is.null,rama_consultado_en.lt.${antes}`)
    .order("rama_consultado_en", { ascending: true, nullsFirst: true })
    .limit(lote);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let avisos = 0;
  for (const caso of casos ?? []) {
    const { nuevas } = await sincronizarCaso(db, caso);
    // En la primera consulta se carga el historial completo: no se avisa.
    if (!nuevas.length || !caso.rama_consultado_en) continue;
    const { data: usuario } = await db.auth.admin.getUserById(caso.abogado_id);
    if (!usuario.user?.email) continue;
    const lista = nuevas.map((a) => `- ${a.fecha}: ${a.actuacion}${a.anotacion ? ` (${a.anotacion})` : ""}${a.termina ? ` · término hasta ${a.termina}` : ""}`).join("\n");
    const res = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${process.env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.ALERTAS_REMITENTE ?? "Red Legal DOMINET <alertas@dominetsas.com>",
        to: usuario.user.email,
        subject: `Nueva actuación: ${caso.titulo} (${caso.radicado})`,
        text: `El proceso ${caso.radicado} tiene ${nuevas.length} actuación(es) nueva(s) en la Rama Judicial:\n\n${lista}\n\nRevísalas en tu panel.`,
      }),
    });
    if (res.ok) avisos++;
  }
  return NextResponse.json({ revisados: casos?.length ?? 0, avisos });
}
