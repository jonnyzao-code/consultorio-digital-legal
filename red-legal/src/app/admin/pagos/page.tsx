import { correos, exigirAdmin, fecha, pesosCentavos } from "@/lib/admin";
import { Tabla, Tarjeta, campo } from "../ui";

export default async function Pagos({ searchParams }: { searchParams: Promise<{ estado?: string; tipo?: string }> }) {
  const { db } = await exigirAdmin();
  const { estado = "", tipo = "" } = await searchParams;
  let q = db.from("pagos").select("*").order("creado_en", { ascending: false }).limit(300);
  if (estado) q = q.eq("estado", estado);
  if (tipo) q = q.eq("tipo", tipo);
  const [{ data: pagos }, { data: aprobados }, emails] = await Promise.all([
    q,
    db.from("pagos").select("monto_centavos, actualizado_en").eq("estado", "aprobado"),
    correos(db),
  ]);
  const porMes = new Map<string, number>();
  for (const p of aprobados ?? []) porMes.set(p.actualizado_en.slice(0, 7), (porMes.get(p.actualizado_en.slice(0, 7)) ?? 0) + Number(p.monto_centavos));
  const meses = [...porMes.entries()].sort().reverse().slice(0, 6);

  return (
    <div className="space-y-5">
      <section className="grid gap-3 sm:grid-cols-6">
        {meses.map(([mes, total]) => <Tarjeta key={mes} titulo={mes} valor={pesosCentavos(total)} />)}
        {!meses.length && <p className="text-sm text-slate-500 sm:col-span-6">Aún no hay pagos aprobados.</p>}
      </section>
      <form className="flex flex-wrap gap-2">
        <select name="tipo" defaultValue={tipo} className={campo}>
          <option value="">Todos los tipos</option><option value="suscripcion">Suscripciones</option><option value="minuta">Minutas</option><option value="concepto">Conceptos</option>
        </select>
        <select name="estado" defaultValue={estado} className={campo}>
          <option value="">Todos los estados</option>
          {["pendiente", "aprobado", "rechazado", "anulado", "error"].map((e) => <option key={e} value={e}>{e}</option>)}
        </select>
        <button className="rounded-md bg-blue-900 px-4 py-2 text-sm text-white">Filtrar</button>
      </form>
      <Tabla columnas={["Fecha", "Usuario", "Tipo", "Detalle", "Valor", "Estado", "Referencia", "Id Wompi"]}>
        {(pagos ?? []).map((p) => (
          <tr key={p.id}>
            <td className="p-2">{fecha(p.creado_en)}</td>
            <td className="p-2">{emails.get(p.perfil_id)?.email ?? "–"}</td>
            <td className="p-2">{p.tipo}</td>
            <td className="p-2">{p.plan ? `${p.plan} ${p.periodicidad}` : (p.minuta_id ?? "–")}</td>
            <td className="p-2">{pesosCentavos(Number(p.monto_centavos))}</td>
            <td className={`p-2 ${p.estado === "aprobado" ? "text-green-700" : p.estado === "pendiente" ? "" : "text-red-700"}`}>{p.estado}</td>
            <td className="p-2 font-mono text-xs">{p.referencia}</td>
            <td className="p-2 font-mono text-xs">{p.wompi_id ?? "–"}</td>
          </tr>
        ))}
      </Tabla>
    </div>
  );
}
