import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { agregarActuacion, agregarTermino, cambiarEstado, cambiarVigilancia, guardarRadicado, marcarCumplido, sincronizarRama } from "../../actions";

const campo = "rounded-md border bg-white p-2";

// Las actuaciones de la Rama de los últimos 3 días se resaltan como nuevas.
const reciente = (creado: string) => Date.now() - new Date(creado).getTime() < 3 * 86_400_000;

export default async function Expediente({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string }> }) {
  const { id } = await params;
  const { error } = await searchParams;
  const supabase = await supabaseServer();
  const [{ data: caso }, { data: actuaciones }, { data: terminos }, { data: auth }] = await Promise.all([
    supabase.from("casos").select("*").eq("id", id).single(),
    supabase.from("actuaciones").select("*").eq("caso_id", id).order("fecha", { ascending: false }).order("creado_en", { ascending: false }),
    supabase.from("terminos").select("*").eq("caso_id", id).order("vence"),
    supabase.auth.getUser(),
  ]);
  if (!caso) notFound();
  const esAbogado = caso.abogado_id === auth.user?.id;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">{caso.titulo}</h1>
        <p className="text-sm text-slate-500">{caso.area} · {caso.radicado ?? "sin radicado"} · {caso.despacho ?? "sin despacho"}</p>
        {caso.rama_clase && <p className="text-sm text-slate-500">{caso.rama_clase}</p>}
        {caso.rama_sujetos && <p className="text-xs text-slate-500">{caso.rama_sujetos}</p>}
        {error && <p className="mt-2 rounded bg-red-50 p-2 text-sm text-red-800">{error}</p>}
        {esAbogado ? (
          <form action={cambiarEstado.bind(null, id)} className="mt-2 flex gap-2 text-sm">
            <select name="estado" defaultValue={caso.estado} className={campo}>
              <option value="en_curso">En curso</option><option value="en_espera">En espera</option><option value="cerrado">Cerrado</option>
            </select>
            <button className="rounded-md border px-3">Actualizar estado</button>
          </form>
        ) : <p className="mt-2 text-sm">Estado: {caso.estado.replace("_", " ")}</p>}
      </div>

      {esAbogado && (
        <section className="rounded-lg border bg-white p-4">
          <h2 className="mb-1 font-semibold">Vigilancia en la Rama Judicial</h2>
          {caso.radicado ? (
            <>
              <p className="text-sm text-slate-600">
                {caso.vigilar ? "Se revisa automáticamente cada día y te avisamos por correo si hay actuaciones nuevas." : "La revisión diaria está desactivada."}
                {caso.rama_consultado_en && ` Última consulta: ${new Date(caso.rama_consultado_en).toLocaleString("es-CO", { timeZone: "America/Bogota" })}.`}
              </p>
              {caso.rama_error && <p className="mt-1 text-sm text-amber-800">{caso.rama_error}</p>}
              <div className="mt-2 flex flex-wrap gap-2 text-sm">
                <form action={sincronizarRama.bind(null, id)}><button className="rounded-md bg-blue-900 px-3 py-2 text-white">Consultar ahora</button></form>
                <form action={cambiarVigilancia.bind(null, id, !caso.vigilar)}>
                  <button className="rounded-md border px-3 py-2">{caso.vigilar ? "Pausar vigilancia" : "Activar vigilancia"}</button>
                </form>
                <a href={`https://consultaprocesos.ramajudicial.gov.co/Procesos/NumeroRadicacion?numero=${caso.radicado}`} target="_blank" rel="noreferrer" className="rounded-md border px-3 py-2">Ver en la Rama Judicial</a>
              </div>
            </>
          ) : (
            <form action={guardarRadicado.bind(null, id)} className="mt-2 flex flex-wrap gap-2 text-sm">
              <input name="radicado" required placeholder="Radicado de 23 dígitos" className={`${campo} flex-1`} />
              <button className="rounded-md bg-blue-900 px-3 py-2 text-white">Vigilar proceso</button>
            </form>
          )}
        </section>
      )}

      {esAbogado && (
        <section>
          <h2 className="mb-2 font-semibold">Términos</h2>
          <ul className="mb-3 space-y-1 text-sm">
            {terminos?.map((t) => (
              <li key={t.id} className={`flex items-center justify-between rounded border bg-white p-2 ${t.cumplido ? "opacity-50" : ""}`}>
                <span>{t.vence} · {t.descripcion}{t.urgente ? " · urgente" : ""}</span>
                {!t.cumplido && (
                  <form action={marcarCumplido.bind(null, id, t.id)}><button className="text-blue-900 underline">Cumplido</button></form>
                )}
              </li>
            ))}
          </ul>
          <form action={agregarTermino.bind(null, id)} className="grid gap-2 sm:grid-cols-4">
            <input name="descripcion" required placeholder="Ej. contestar demanda" className={`${campo} sm:col-span-2`} />
            <input name="desde" type="date" title="Desde (notificación)" className={campo} />
            <input name="dias" type="number" min={1} required placeholder="Días hábiles" className={campo} />
            <label className="flex gap-2 text-sm"><input type="checkbox" name="judicial" defaultChecked />Descontar vacancia judicial</label>
            <label className="flex gap-2 text-sm"><input type="checkbox" name="urgente" />Urgente</label>
            <button className="rounded-md bg-blue-900 px-4 py-2 text-white sm:col-span-2">Agregar término</button>
          </form>
        </section>
      )}

      <section>
        <h2 className="mb-2 font-semibold">Actuaciones</h2>
        <ul className="mb-3 space-y-1 text-sm">
          {actuaciones?.map((a) => (
            <li key={a.id} className={`rounded border bg-white p-2 ${a.fuente === "rama_judicial" && reciente(a.creado_en) ? "border-blue-400" : ""}`}>
              <span className="font-medium">{a.fecha}</span> · {a.descripcion}
              {a.fuente === "rama_judicial" && <span className="ml-2 rounded bg-slate-100 px-1 text-xs text-slate-600">Rama Judicial{reciente(a.creado_en) ? " · nueva" : ""}</span>}
              {a.anotacion && <p className="mt-1 text-xs text-slate-600">{a.anotacion}</p>}
            </li>
          ))}
          {!actuaciones?.length && <li className="text-slate-500">Sin actuaciones registradas.</li>}
        </ul>
        {esAbogado && (
          <form action={agregarActuacion.bind(null, id)} className="grid gap-2 sm:grid-cols-4">
            <input name="fecha" type="date" required className={campo} />
            <input name="descripcion" required placeholder="Descripción de la actuación" className={`${campo} sm:col-span-2`} />
            <button className="rounded-md bg-blue-900 px-4 py-2 text-white">Agregar</button>
          </form>
        )}
      </section>
    </div>
  );
}
