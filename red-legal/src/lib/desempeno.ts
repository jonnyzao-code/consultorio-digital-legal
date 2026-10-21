import "server-only";
import type { Db } from "./admin";
import { hoyMas } from "./terminos";

export type Desempeno = {
  activos: number;
  cerrados: number;
  horasPrimeraRespuesta: number | null;
  diasSolucion: number | null;
  terminosVencidos: number;
  calificacion: number | null;
  ultimaActividad: string | null;
};

const promedio = (xs: number[]) => (xs.length ? Math.round((xs.reduce((a, b) => a + b, 0) / xs.length) * 10) / 10 : null);
const horas = (a: string, b: string) => (new Date(b).getTime() - new Date(a).getTime()) / 3_600_000;

/** Métricas por abogado calculadas con service role (la vista metricas_abogados depende de auth.uid()). */
export async function desempeno(db: Db, abogadoIds?: string[]) {
  let qc = db.from("casos").select("id, abogado_id, estado, abierto_en, primera_respuesta_en, cerrado_en");
  if (abogadoIds) qc = qc.in("abogado_id", abogadoIds);
  const { data: casos } = await qc;
  const ids = (casos ?? []).map((c) => c.id);
  const [{ data: terminos }, { data: notas }, { data: acts }] = await Promise.all([
    ids.length ? db.from("terminos").select("caso_id, vence, cumplido").in("caso_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? db.from("calificaciones").select("caso_id, estrellas").in("caso_id", ids) : Promise.resolve({ data: [] }),
    ids.length ? db.from("actuaciones").select("caso_id, creado_en").in("caso_id", ids) : Promise.resolve({ data: [] }),
  ]);
  const hoy = hoyMas();
  const dueno = new Map((casos ?? []).map((c) => [c.id, c.abogado_id]));
  const res = new Map<string, Desempeno>();
  const de = (id: string) => {
    if (!res.has(id)) res.set(id, { activos: 0, cerrados: 0, horasPrimeraRespuesta: null, diasSolucion: null, terminosVencidos: 0, calificacion: null, ultimaActividad: null });
    return res.get(id)!;
  };
  const respuestas = new Map<string, number[]>(), soluciones = new Map<string, number[]>(), estrellas = new Map<string, number[]>();
  const push = (m: Map<string, number[]>, k: string, v: number) => m.set(k, [...(m.get(k) ?? []), v]);
  for (const c of casos ?? []) {
    const d = de(c.abogado_id);
    if (c.estado === "cerrado") d.cerrados++;
    else d.activos++;
    if (c.primera_respuesta_en) push(respuestas, c.abogado_id, horas(c.abierto_en, c.primera_respuesta_en));
    if (c.cerrado_en) push(soluciones, c.abogado_id, horas(c.abierto_en, c.cerrado_en) / 24);
  }
  for (const t of terminos ?? []) if (!t.cumplido && t.vence < hoy) de(dueno.get(t.caso_id)!).terminosVencidos++;
  for (const n of notas ?? []) push(estrellas, dueno.get(n.caso_id)!, n.estrellas);
  for (const a of acts ?? []) {
    const d = de(dueno.get(a.caso_id)!);
    if (!d.ultimaActividad || a.creado_en > d.ultimaActividad) d.ultimaActividad = a.creado_en;
  }
  for (const [id, d] of res) {
    d.horasPrimeraRespuesta = promedio(respuestas.get(id) ?? []);
    d.diasSolucion = promedio(soluciones.get(id) ?? []);
    d.calificacion = promedio(estrellas.get(id) ?? []);
  }
  return res;
}
