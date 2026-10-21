import Link from "next/link";
import { correos, exigirAdmin, fecha } from "@/lib/admin";
import { desempeno } from "@/lib/desempeno";
import { plan } from "@/lib/planes";
import { hoyMas } from "@/lib/terminos";
import { Tabla } from "../ui";

export default async function Abogados() {
  const { db } = await exigirAdmin();
  const hoy = hoyMas();
  const [{ data: abogados }, { data: perfiles }, { data: subs }, emails, metricas] = await Promise.all([
    db.from("abogados").select("id, tarjeta_profesional, ciudad, areas, plan, activo"),
    db.from("perfiles").select("id, nombre, suspendido").eq("rol", "abogado"),
    db.from("suscripciones").select("abogado_id, vigente_hasta").order("vigente_hasta", { ascending: false }),
    correos(db),
    desempeno(db),
  ]);
  const nombre = new Map((perfiles ?? []).map((p) => [p.id, p]));
  const vigencia = new Map<string, string>();
  for (const s of subs ?? []) if (!vigencia.has(s.abogado_id)) vigencia.set(s.abogado_id, s.vigente_hasta);

  return (
    <div className="space-y-3">
      <p className="text-sm text-slate-500">{abogados?.length ?? 0} abogados. Haz clic en un nombre para ver su historial y el avance de cada caso.</p>
      <Tabla columnas={["Abogado", "Correo", "Ciudad", "Plan", "Vigente hasta", "Estado", "Activos", "Cerrados", "1.ª respuesta (h)", "Solución (días)", "Términos vencidos", "Calificación", "Última actividad"]}>
        {(abogados ?? []).map((a) => {
          const m = metricas.get(a.id);
          const vence = vigencia.get(a.id);
          return (
            <tr key={a.id}>
              <td className="p-2"><Link href={`/admin/abogados/${a.id}`} className="font-medium text-blue-900 underline">{nombre.get(a.id)?.nombre ?? "–"}</Link></td>
              <td className="p-2">{emails.get(a.id)?.email}</td>
              <td className="p-2">{a.ciudad}</td>
              <td className="p-2">{plan(a.plan).nombre}</td>
              <td className={`p-2 ${!vence || vence < hoy ? "text-red-700" : ""}`}>{vence ?? "sin pago"}</td>
              <td className="p-2">{nombre.get(a.id)?.suspendido ? "Suspendido" : a.activo ? "Activo" : "Inactivo"}</td>
              <td className="p-2">{m?.activos ?? 0}</td>
              <td className="p-2">{m?.cerrados ?? 0}</td>
              <td className="p-2">{m?.horasPrimeraRespuesta ?? "–"}</td>
              <td className="p-2">{m?.diasSolucion ?? "–"}</td>
              <td className={`p-2 ${m?.terminosVencidos ? "font-semibold text-red-700" : ""}`}>{m?.terminosVencidos ?? 0}</td>
              <td className="p-2">{m?.calificacion ?? "–"}</td>
              <td className="p-2">{fecha(m?.ultimaActividad)}</td>
            </tr>
          );
        })}
      </Tabla>
    </div>
  );
}
