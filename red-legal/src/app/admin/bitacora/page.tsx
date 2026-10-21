import { correos, exigirAdmin } from "@/lib/admin";
import { Tabla } from "../ui";

export default async function Bitacora() {
  const { db } = await exigirAdmin();
  const [{ data }, emails] = await Promise.all([db.from("bitacora_admin").select("*").order("creado_en", { ascending: false }).limit(300), correos(db)]);
  return (
    <Tabla columnas={["Fecha", "Administrador", "Acción", "Sobre", "Detalle"]}>
      {(data ?? []).map((b) => (
        <tr key={b.id}>
          <td className="p-2 whitespace-nowrap">{new Date(b.creado_en).toLocaleString("es-CO", { timeZone: "America/Bogota" })}</td>
          <td className="p-2">{emails.get(b.admin_id)?.email}</td>
          <td className="p-2">{b.accion.replace(/_/g, " ")}</td>
          <td className="p-2">{emails.get(b.objetivo)?.email ?? b.objetivo}</td>
          <td className="p-2 font-mono text-xs">{b.detalle ? JSON.stringify(b.detalle) : ""}</td>
        </tr>
      ))}
    </Tabla>
  );
}
