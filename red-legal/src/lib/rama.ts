// Consulta de Procesos Nacional Unificada (CPNU) de la Rama Judicial.
// Portado de la herramienta de seguimiento existente (lovable-juridico). La API solo responde JSON en el puerto 448.
const BASE = "https://consultaprocesos.ramajudicial.gov.co:448/api/v2";

export type ActuacionRama = {
  ramaId: number;
  fecha: string; // AAAA-MM-DD
  actuacion: string;
  anotacion: string | null;
  inicia: string | null;
  termina: string | null;
};

export type ProcesoRama = {
  idProceso: number;
  radicado: string;
  despacho: string | null;
  departamento: string | null;
  sujetos: string | null;
  tipo: string | null;
  clase: string | null;
  ponente: string | null;
  ubicacion: string | null;
  ultimaActuacion: string | null;
  actuaciones: ActuacionRama[];
};

const fecha = (v: unknown) => (typeof v === "string" && v.length >= 10 ? v.slice(0, 10) : null);

async function getJson(url: string) {
  let ultimo: unknown;
  for (let intento = 0; intento < 3; intento++) {
    try {
      const res = await fetch(url, { headers: { Accept: "application/json" }, signal: AbortSignal.timeout(15_000) });
      if (!res.ok) throw new Error(`el portal respondió ${res.status}`);
      return await res.json();
    } catch (e) {
      ultimo = e;
      await new Promise((r) => setTimeout(r, 800 * (intento + 1)));
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error("el portal no respondió");
}

/** Deja solo dígitos. Un radicado completo tiene 23 (21 sin los dos de instancia). */
export const limpiarRadicado = (r: string) => r.replace(/\D/g, "");

/** Lee las partes del radicado: DANE (5), entidad (2), especialidad (2), despacho (3), año (4), consecutivo (5), instancia (2). */
export function partesRadicado(r: string) {
  const n = limpiarRadicado(r);
  if (n.length !== 23 && n.length !== 21) return null;
  return { municipio: n.slice(0, 5), entidad: n.slice(5, 7), especialidad: n.slice(7, 9), despacho: n.slice(9, 12), anio: n.slice(12, 16), consecutivo: n.slice(16, 21), instancia: n.slice(21) || null };
}

/** Busca el proceso por radicado y trae detalle y actuaciones. Devuelve null si no existe o es privado. */
export async function consultarRadicado(radicado: string): Promise<ProcesoRama | null> {
  const numero = limpiarRadicado(radicado);
  const candidatos = numero.length === 23 ? [numero] : numero.length === 21 ? [`${numero}00`, `${numero}01`] : [];
  if (!candidatos.length) throw new Error("El radicado debe tener 23 dígitos (o 21 sin instancia).");

  let p: Record<string, unknown> | undefined;
  for (const cand of candidatos) {
    const lista = await getJson(`${BASE}/Procesos/Consulta/NumeroRadicacion?numero=${cand}&SoloActivos=false&pagina=1`);
    p = Array.isArray(lista?.procesos) ? lista.procesos.find((x: { esPrivado?: boolean }) => !x.esPrivado) : undefined;
    if (p) break;
  }
  if (!p) return null;

  const id = Number(p.idProceso);
  const [detalle, actuaciones] = await Promise.allSettled([
    getJson(`${BASE}/Proceso/Detalle/${id}`),
    getJson(`${BASE}/Proceso/Actuaciones/${id}?pagina=1`),
  ]);
  const d = detalle.status === "fulfilled" ? detalle.value ?? {} : {};
  const acts: Record<string, unknown>[] =
    actuaciones.status === "fulfilled" && Array.isArray(actuaciones.value?.actuaciones) ? actuaciones.value.actuaciones : [];

  return {
    idProceso: id,
    radicado: String(p.llaveProceso ?? numero),
    despacho: (p.despacho as string)?.trim() || null,
    departamento: (p.departamento as string) ?? null,
    sujetos: (p.sujetosProcesales as string)?.trim() || null,
    tipo: d.tipoProceso ?? null,
    clase: d.claseProceso ?? null,
    ponente: d.ponente ?? null,
    ubicacion: d.ubicacion ?? null,
    ultimaActuacion: fecha(p.fechaUltimaActuacion),
    actuaciones: acts
      .filter((a) => fecha(a.fechaActuacion) && a.actuacion)
      .map((a) => ({
        ramaId: Number(a.idRegActuacion),
        fecha: fecha(a.fechaActuacion)!,
        actuacion: String(a.actuacion).trim(),
        anotacion: (a.anotacion as string)?.trim() || null,
        inicia: fecha(a.fechaInicial),
        termina: fecha(a.fechaFinal),
      })),
  };
}
