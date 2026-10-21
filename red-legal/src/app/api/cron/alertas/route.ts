import { NextResponse } from "next/server";
import { enviarCorreo } from "@/lib/correo";
import { autorizado } from "@/lib/cron";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { venceTermino } from "@/lib/terminos";

// Ejecutado a diario por Vercel Cron. Avisa por correo los términos que vencen en 3 días hábiles o menos.
export async function GET(req: Request) {
  if (!autorizado(req)) {
    return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  }
  const db = supabaseAdmin();
  const hoy = new Date().toISOString().slice(0, 10);
  const limite = venceTermino(hoy, 3);
  const { data: terminos, error } = await db
    .from("terminos")
    .select("id, descripcion, vence, urgente, casos(titulo, abogado_id)")
    .eq("cumplido", false)
    .lte("vence", limite)
    .or(`ultimo_aviso_en.is.null,ultimo_aviso_en.lt.${hoy}`);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  let enviados = 0;
  for (const t of terminos ?? []) {
    const caso = Array.isArray(t.casos) ? t.casos[0] : t.casos;
    if (!caso) continue;
    const { data: usuario } = await db.auth.admin.getUserById(caso.abogado_id);
    const email = usuario.user?.email;
    if (!email) continue;
    const vencido = t.vence < hoy;
    const ok = await enviarCorreo({
      para: email,
      asunto: `${vencido ? "VENCIDO" : t.urgente ? "URGENTE" : "Recordatorio"}: ${t.descripcion} (${t.vence})`,
      texto: `Caso: ${caso.titulo}\nTérmino: ${t.descripcion}\nVence: ${t.vence}\n\nIngresa a tu panel para gestionarlo.`,
    });
    if (ok) {
      enviados++;
      await db.from("terminos").update({ ultimo_aviso_en: new Date().toISOString() }).eq("id", t.id);
    }
  }
  return NextResponse.json({ revisados: terminos?.length ?? 0, enviados });
}
