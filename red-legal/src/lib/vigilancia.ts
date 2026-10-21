import type { SupabaseClient } from "@supabase/supabase-js";
import { consultarRadicado, type ActuacionRama } from "./rama";
import { hoyMas } from "./terminos";

type Caso = { id: string; radicado: string | null };

/**
 * Trae las actuaciones del proceso desde la Rama Judicial, guarda solo las nuevas y crea
 * los términos que el despacho haya registrado (fecha final) y aún no vencen.
 */
export async function sincronizarCaso(db: SupabaseClient, caso: Caso): Promise<{ nuevas: ActuacionRama[]; error?: string }> {
  if (!caso.radicado) return { nuevas: [], error: "El caso no tiene radicado." };
  const ahora = new Date().toISOString();
  try {
    const proceso = await consultarRadicado(caso.radicado);
    if (!proceso) {
      const error = "El radicado no aparece en Consulta de Procesos (proceso privado o despacho no integrado).";
      await db.from("casos").update({ rama_consultado_en: ahora, rama_error: error }).eq("id", caso.id);
      return { nuevas: [], error };
    }

    const { data: existentes } = await db.from("actuaciones").select("rama_id").eq("caso_id", caso.id).not("rama_id", "is", null);
    const vistas = new Set((existentes ?? []).map((a) => Number(a.rama_id)));
    const nuevas = proceso.actuaciones.filter((a) => !vistas.has(a.ramaId));

    if (nuevas.length) {
      await db.from("actuaciones").upsert(
        nuevas.map((a) => ({
          caso_id: caso.id,
          fecha: a.fecha,
          descripcion: a.actuacion,
          anotacion: a.anotacion,
          fuente: "rama_judicial",
          rama_id: a.ramaId,
        })),
        { onConflict: "caso_id,rama_id", ignoreDuplicates: true },
      );
      const hoy = hoyMas();
      const terminos = nuevas
        .filter((a) => a.termina && a.termina >= hoy)
        .map((a) => ({ caso_id: caso.id, descripcion: `Término (Rama Judicial): ${a.actuacion}`, vence: a.termina!, urgente: true }));
      if (terminos.length) await db.from("terminos").insert(terminos);
    }

    await db
      .from("casos")
      .update({
        rama_id_proceso: proceso.idProceso,
        rama_consultado_en: ahora,
        rama_error: null,
        rama_sujetos: proceso.sujetos,
        rama_clase: [proceso.tipo, proceso.clase].filter(Boolean).join(" · ") || null,
        despacho: proceso.despacho,
      })
      .eq("id", caso.id);
    return { nuevas };
  } catch (e) {
    const error = `La Rama Judicial no respondió (${e instanceof Error ? e.message : "error"}). Se reintenta en la próxima revisión.`;
    await db.from("casos").update({ rama_consultado_en: ahora, rama_error: error }).eq("id", caso.id);
    return { nuevas: [], error };
  }
}
