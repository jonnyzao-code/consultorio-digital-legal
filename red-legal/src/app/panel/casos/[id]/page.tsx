import { notFound } from "next/navigation";
import { supabaseServer } from "@/lib/supabase/server";
import { agregarActuacion, agregarTermino, cambiarEstado, marcarCumplido } from "../../actions";

const campo = "rounded-md border bg-white p-2";

export default async function Expediente({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await supabaseServer();
  const [{ data: caso }, { data: actuaciones }, { data: terminos }, { data: auth }] = await Promise.all([
    supabase.from("casos").select("*").eq("id", id).single(),
    supabase.from("actuaciones").select("*").eq("caso_id", id).order("fecha", { ascending: false }),
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
          {actuaciones?.map((a) => <li key={a.id} className="rounded border bg-white p-2">{a.fecha} · {a.descripcion}</li>)}
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
