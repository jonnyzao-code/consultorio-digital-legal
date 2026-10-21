import { NextResponse } from "next/server";
import { autorizado } from "@/lib/cron";

// Comprueba si el servidor alcanza la API de la Rama Judicial (puerto 448).
export async function GET(req: Request) {
  if (!autorizado(req)) return NextResponse.json({ error: "No autorizado" }, { status: 401 });
  const inicio = Date.now();
  try {
    const res = await fetch(
      "https://consultaprocesos.ramajudicial.gov.co:448/api/v2/Procesos/Consulta/NumeroRadicacion?numero=11001310300120230012300&SoloActivos=false&pagina=1",
      { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(20_000) },
    );
    const cuerpo = await res.text();
    return NextResponse.json({ status: res.status, ms: Date.now() - inicio, json: cuerpo.trimStart().startsWith("{"), muestra: cuerpo.slice(0, 120) });
  } catch (e) {
    return NextResponse.json({ error: e instanceof Error ? e.message : String(e), ms: Date.now() - inicio });
  }
}
