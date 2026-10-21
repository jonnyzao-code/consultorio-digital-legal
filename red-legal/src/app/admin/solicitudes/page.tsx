import { exigirAdmin, fecha } from "@/lib/admin";
import { plan } from "@/lib/planes";
import { aprobarSolicitud, rechazarSolicitud } from "../actions";
import { Tabla } from "../ui";

export default async function Solicitudes({ searchParams }: { searchParams: Promise<{ estado?: string }> }) {
  const { db } = await exigirAdmin();
  const { estado = "pendiente" } = await searchParams;
  const { data } = await db.from("solicitudes_abogados").select("*").eq("estado", estado).order("creado_en", { ascending: false });

  return (
    <div className="space-y-4">
      <div className="flex gap-2 text-sm">
        {["pendiente", "aprobada", "rechazada"].map((e) => (
          <a key={e} href={`?estado=${e}`} className={`rounded-md border px-3 py-1 ${e === estado ? "bg-blue-900 text-white" : "bg-white"}`}>{e}</a>
        ))}
      </div>
      <p className="text-sm text-slate-600">
        Antes de aprobar, verifica la tarjeta profesional en el{" "}
        <a href="https://sirna.ramajudicial.gov.co" target="_blank" rel="noreferrer" className="underline">Registro Nacional de Abogados (SIRNA)</a>.
        Al aprobar, si el abogado no tiene cuenta se le envía una invitación por correo.
      </p>
      <Tabla columnas={["Fecha", "Nombre", "Correo", "Celular", "Ciudad", "Tarjeta", "Áreas", "Plan", "Contrato", estado === "pendiente" ? "Acción" : ""]}>
        {(data ?? []).map((s) => (
          <tr key={s.id}>
            <td className="p-2">{fecha(s.creado_en)}</td>
            <td className="p-2">{s.nombre}</td>
            <td className="p-2">{s.email}</td>
            <td className="p-2">{s.telefono}</td>
            <td className="p-2">{s.ciudad}</td>
            <td className="p-2 font-mono">{s.tarjeta_profesional}</td>
            <td className="p-2">{s.areas.join(", ")}</td>
            <td className="p-2">{plan(s.plan).nombre}</td>
            <td className="p-2 text-xs">{s.terminos_version ?? "–"}</td>
            <td className="p-2">
              {estado === "pendiente" && (
                <div className="flex gap-1">
                  <form action={aprobarSolicitud.bind(null, s.id)}><button className="rounded bg-green-700 px-2 py-1 text-xs text-white">Aprobar</button></form>
                  <form action={rechazarSolicitud.bind(null, s.id)}><button className="rounded border px-2 py-1 text-xs text-red-700">Rechazar</button></form>
                </div>
              )}
            </td>
          </tr>
        ))}
      </Tabla>
    </div>
  );
}
