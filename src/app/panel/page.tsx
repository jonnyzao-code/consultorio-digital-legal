import Link from "next/link";
import { AREAS } from "@/lib/areas";
import { supabaseServer } from "@/lib/supabase/server";
import { crearCaso } from "./actions";

const campo = "rounded-md border bg-white p-2";

export default async function Panel() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from("perfiles").select("nombre, rol, codigo_referido").eq("id", auth.user!.id).single();
  if (!perfil) return <p>No encontramos tu perfil.</p>;

  if (perfil.rol === "admin") {
    const [{ data: metricas }, { data: solicitudes }] = await Promise.all([
      supabase.from("metricas_abogados").select("*"),
      supabase.from("solicitudes_abogados").select("id, nombre, tarjeta_profesional, ciudad, areas, plan").eq("estado", "pendiente"),
    ]);
    return (
      <div className="space-y-8">
        <h1 className="text-2xl font-bold text-blue-900">Panel del administrador</h1>
        <section>
          <h2 className="mb-2 font-semibold">Desempeño de abogados</h2>
          <table className="w-full bg-white text-sm">
            <thead><tr className="text-left">{["Abogado", "Activos", "Cerrados", "Horas 1.ª respuesta", "Días solución", "Términos vencidos", "Calificación"].map((h) => <th key={h} className="border-b p-2">{h}</th>)}</tr></thead>
            <tbody>
              {metricas?.map((m) => (
                <tr key={m.abogado_id}>
                  <td className="p-2">{m.nombre}</td><td className="p-2">{m.casos_activos}</td><td className="p-2">{m.casos_cerrados}</td>
                  <td className="p-2">{m.horas_primera_respuesta ?? "–"}</td><td className="p-2">{m.dias_solucion ?? "–"}</td>
                  <td className={`p-2 ${m.terminos_vencidos > 0 ? "font-semibold text-red-700" : ""}`}>{m.terminos_vencidos}</td>
                  <td className="p-2">{m.calificacion ?? "–"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
        <section>
          <h2 className="mb-2 font-semibold">Solicitudes pendientes ({solicitudes?.length ?? 0})</h2>
          <p className="mb-2 text-xs text-slate-500">Verifica cada tarjeta profesional en el Registro Nacional de Abogados (SIRNA) antes de aprobar.</p>
          <ul className="space-y-1 text-sm">
            {solicitudes?.map((s) => <li key={s.id} className="rounded border bg-white p-2">{s.nombre} · TP {s.tarjeta_profesional} · {s.ciudad} · {s.areas.join(", ")} · {s.plan}</li>)}
          </ul>
        </section>
      </div>
    );
  }

  const { data: casos } = await supabase.from("casos").select("id, titulo, area, radicado, estado").order("abierto_en", { ascending: false });
  const limite = new Date(Date.now() + 7 * 86_400_000).toISOString().slice(0, 10);
  const { data: proximos } = perfil.rol === "abogado"
    ? await supabase.from("terminos").select("id, descripcion, vence, urgente, caso_id").eq("cumplido", false).lte("vence", limite).order("vence")
    : { data: [] };

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Hola, {perfil.nombre}</h1>
        <p className="text-sm text-slate-500">Tu código de referido: <span className="font-mono">{perfil.codigo_referido}</span></p>
      </div>

      {perfil.rol === "abogado" && (
        <section>
          <h2 className="mb-2 font-semibold">Términos que vencen en los próximos 7 días</h2>
          {proximos?.length ? (
            <ul className="space-y-1 text-sm">
              {proximos.map((t) => (
                <li key={t.id} className={`rounded border bg-white p-2 ${t.urgente ? "border-red-400" : ""}`}>
                  <Link href={`/panel/casos/${t.caso_id}`}>{t.vence} · {t.descripcion}</Link>
                </li>
              ))}
            </ul>
          ) : <p className="text-sm text-slate-500">Nada pendiente esta semana.</p>}
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold">Casos</h2>
        <ul className="space-y-1 text-sm">
          {casos?.map((c) => (
            <li key={c.id} className="rounded border bg-white p-2">
              <Link href={`/panel/casos/${c.id}`} className="font-medium">{c.titulo}</Link>
              <span className="text-slate-500"> · {c.area} · {c.radicado ?? "sin radicado"} · {c.estado.replace("_", " ")}</span>
            </li>
          ))}
        </ul>
      </section>

      {perfil.rol === "abogado" && (
        <form action={crearCaso} className="grid gap-2 rounded-lg border bg-white p-4 sm:grid-cols-2">
          <h2 className="font-semibold sm:col-span-2">Nuevo caso</h2>
          <input name="titulo" required placeholder="Título del caso" className={campo} />
          <select name="area" className={campo}>{AREAS.map((a) => <option key={a.id} value={a.id}>{a.nombre}</option>)}</select>
          <input name="radicado" placeholder="Radicado (23 dígitos)" className={campo} />
          <input name="despacho" placeholder="Despacho o juzgado" className={campo} />
          <button className="rounded-md bg-blue-900 px-4 py-2 text-white sm:col-span-2">Crear caso</button>
        </form>
      )}
    </div>
  );
}
