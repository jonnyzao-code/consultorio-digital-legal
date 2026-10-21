import { notFound } from "next/navigation";
import { correos, exigirAdmin, fecha } from "@/lib/admin";
import { desempeno } from "@/lib/desempeno";
import { PLANES, plan } from "@/lib/planes";
import { hoyMas } from "@/lib/terminos";
import { actualizarAbogado, otorgarSuscripcion } from "../../actions";
import { Tabla, Tarjeta, campo } from "../../ui";

// El administrador ve el avance de los casos (estado, fechas, términos y actuaciones públicas de la Rama),
// no las notas que el abogado registra a mano: esas quedan bajo secreto profesional.
export default async function DetalleAbogado({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const { db } = await exigirAdmin();
  const hoy = hoyMas();
  const [{ data: abogado }, { data: perfil }, { data: subs }, { data: casos }, emails, metricas] = await Promise.all([
    db.from("abogados").select("*").eq("id", id).maybeSingle(),
    db.from("perfiles").select("nombre, telefono, suspendido, codigo_referido").eq("id", id).maybeSingle(),
    db.from("suscripciones").select("*").eq("abogado_id", id).order("vigente_hasta", { ascending: false }),
    db.from("casos").select("*").eq("abogado_id", id).order("abierto_en", { ascending: false }),
    correos(db),
    desempeno(db, [id]),
  ]);
  if (!abogado || !perfil) notFound();
  const ids = (casos ?? []).map((c) => c.id);
  const [{ data: acts }, { data: terminos }] = await Promise.all([
    ids.length ? db.from("actuaciones").select("caso_id, fecha, descripcion, fuente").in("caso_id", ids).order("fecha", { ascending: false }) : Promise.resolve({ data: [] }),
    ids.length ? db.from("terminos").select("caso_id, descripcion, vence, cumplido").in("caso_id", ids).order("vence") : Promise.resolve({ data: [] }),
  ]);
  const m = metricas.get(id);
  const vigente = subs?.[0];

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-lg font-semibold">{perfil.nombre}</h2>
        <p className="text-sm text-slate-600">
          {emails.get(id)?.email} · {perfil.telefono ?? "sin celular"} · TP {abogado.tarjeta_profesional} · {abogado.ciudad} · {abogado.areas.join(", ")}
        </p>
      </div>

      <section className="grid gap-3 sm:grid-cols-4">
        <Tarjeta titulo="Casos activos" valor={m?.activos ?? 0} nota={`${m?.cerrados ?? 0} cerrados`} />
        <Tarjeta titulo="1.ª respuesta" valor={m?.horasPrimeraRespuesta != null ? `${m.horasPrimeraRespuesta} h` : "–"} />
        <Tarjeta titulo="Términos vencidos" valor={m?.terminosVencidos ?? 0} />
        <Tarjeta titulo="Calificación" valor={m?.calificacion ?? "–"} nota={`Última actividad: ${fecha(m?.ultimaActividad)}`} />
      </section>

      <section className="grid gap-4 sm:grid-cols-2">
        <form action={actualizarAbogado.bind(null, id)} className="space-y-2 rounded-lg border bg-white p-4">
          <h3 className="font-semibold">Plan y estado</h3>
          <div className="flex flex-wrap gap-2">
            <select name="plan" defaultValue={abogado.plan} className={campo}>{PLANES.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
            <select name="activo" defaultValue={abogado.activo ? "si" : "no"} className={campo}>
              <option value="si">Activo en el directorio</option><option value="no">Inactivo</option>
            </select>
            <button className="rounded-md bg-blue-900 px-3 py-2 text-sm text-white">Guardar</button>
          </div>
        </form>
        <form action={otorgarSuscripcion.bind(null, id)} className="space-y-2 rounded-lg border bg-white p-4">
          <h3 className="font-semibold">Suscripción</h3>
          <p className="text-sm text-slate-600">
            {vigente ? `${plan(vigente.plan).nombre} vigente hasta ${vigente.vigente_hasta}${vigente.vigente_hasta < hoy ? " (vencida)" : ""}` : "Nunca ha pagado."}
          </p>
          <div className="flex flex-wrap gap-2">
            <select name="plan" defaultValue={abogado.plan} className={campo}>{PLANES.map((p) => <option key={p.id} value={p.id}>{p.nombre}</option>)}</select>
            <input name="hasta" type="date" required className={campo} />
            <button className="rounded-md border px-3 py-2 text-sm">Otorgar (cortesía o pago externo)</button>
          </div>
        </form>
      </section>

      <section>
        <h3 className="mb-2 font-semibold">Historial de pagos</h3>
        <Tabla columnas={["Plan", "Periodicidad", "Valor", "Descuento", "Vigente hasta", "Referencia"]}>
          {(subs ?? []).map((s) => (
            <tr key={s.id}>
              <td className="p-2">{plan(s.plan).nombre}</td><td className="p-2">{s.periodicidad}</td>
              <td className="p-2">${Number(s.valor_cop).toLocaleString("es-CO")}</td><td className="p-2">{s.descuento_pct}%</td>
              <td className="p-2">{s.vigente_hasta}</td><td className="p-2 text-xs">{s.referencia_pasarela}</td>
            </tr>
          ))}
        </Tabla>
      </section>

      <section className="space-y-3">
        <h3 className="font-semibold">Casos y avance</h3>
        {(casos ?? []).map((c) => {
          const propias = (acts ?? []).filter((a) => a.caso_id === c.id);
          const pendientes = (terminos ?? []).filter((t) => t.caso_id === c.id && !t.cumplido);
          const vencidos = pendientes.filter((t) => t.vence < hoy).length;
          return (
            <details key={c.id} className="rounded-lg border bg-white p-3 text-sm">
              <summary className="cursor-pointer">
                <span className="font-medium">{c.titulo}</span> · {c.area} · {c.estado.replace("_", " ")} · abierto {fecha(c.abierto_en)}
                {c.radicado && ` · ${c.radicado}`} · {propias.length} actuaciones
                {vencidos > 0 && <span className="ml-1 font-semibold text-red-700">· {vencidos} término(s) vencido(s)</span>}
              </summary>
              <div className="mt-2 grid gap-3 sm:grid-cols-2">
                <div>
                  <p className="mb-1 font-medium">Actuaciones</p>
                  <ul className="space-y-1">
                    {propias.map((a, i) => (
                      <li key={i}>{a.fecha} · {a.fuente === "rama_judicial" ? a.descripcion : <span className="text-slate-500">Registro del abogado</span>}</li>
                    ))}
                    {!propias.length && <li className="text-slate-500">Sin actuaciones.</li>}
                  </ul>
                </div>
                <div>
                  <p className="mb-1 font-medium">Términos pendientes</p>
                  <ul className="space-y-1">
                    {pendientes.map((t, i) => <li key={i} className={t.vence < hoy ? "text-red-700" : ""}>{t.vence} · {t.descripcion}</li>)}
                    {!pendientes.length && <li className="text-slate-500">Ninguno.</li>}
                  </ul>
                  {c.rama_consultado_en && <p className="mt-2 text-xs text-slate-500">Rama Judicial consultada: {fecha(c.rama_consultado_en)}</p>}
                </div>
              </div>
            </details>
          );
        })}
        {!casos?.length && <p className="text-sm text-slate-500">Sin casos.</p>}
      </section>
    </div>
  );
}
