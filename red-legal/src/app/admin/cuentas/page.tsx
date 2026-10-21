import { correos, exigirAdmin, fecha } from "@/lib/admin";
import { cambiarRol, suspender } from "../actions";
import { Tabla, campo } from "../ui";

export default async function Cuentas({ searchParams }: { searchParams: Promise<{ q?: string; rol?: string }> }) {
  const { db, adminId } = await exigirAdmin();
  const { q = "", rol = "" } = await searchParams;
  const [{ data: perfiles }, emails] = await Promise.all([
    db.from("perfiles").select("id, nombre, rol, telefono, suspendido, creado_en").order("creado_en", { ascending: false }),
    correos(db),
  ]);
  const buscar = q.toLowerCase();
  const filas = (perfiles ?? []).filter(
    (p) => (!rol || p.rol === rol) && (!buscar || p.nombre.toLowerCase().includes(buscar) || emails.get(p.id)?.email.toLowerCase().includes(buscar)),
  );

  return (
    <div className="space-y-4">
      <form className="flex flex-wrap gap-2">
        <input name="q" defaultValue={q} placeholder="Buscar por nombre o correo" className={`${campo} flex-1`} />
        <select name="rol" defaultValue={rol} className={campo}>
          <option value="">Todos los roles</option><option value="cliente">Clientes</option><option value="abogado">Abogados</option><option value="admin">Administradores</option>
        </select>
        <button className="rounded-md bg-blue-900 px-4 py-2 text-sm text-white">Filtrar</button>
      </form>
      <p className="text-sm text-slate-500">{filas.length} cuentas</p>
      <Tabla columnas={["Nombre", "Correo", "Celular", "Registro", "Último ingreso", "Rol", "Estado"]}>
        {filas.map((p) => (
          <tr key={p.id} className={p.suspendido ? "bg-red-50" : ""}>
            <td className="p-2">{p.nombre}</td>
            <td className="p-2">{emails.get(p.id)?.email ?? "–"}</td>
            <td className="p-2">{p.telefono ?? "–"}</td>
            <td className="p-2">{fecha(p.creado_en)}</td>
            <td className="p-2">{fecha(emails.get(p.id)?.ultimo)}</td>
            <td className="p-2">
              <form action={cambiarRol.bind(null, p.id)} className="flex gap-1">
                <select name="rol" defaultValue={p.rol} className={campo} disabled={p.id === adminId}>
                  <option value="cliente">Cliente</option><option value="abogado">Abogado</option><option value="admin">Admin</option>
                </select>
                {p.id !== adminId && <button className="rounded border px-2 text-xs">Guardar</button>}
              </form>
            </td>
            <td className="p-2">
              {p.id !== adminId && (
                <form action={suspender.bind(null, p.id, !p.suspendido)}>
                  <button className={`rounded border px-2 py-1 text-xs ${p.suspendido ? "" : "text-red-700"}`}>{p.suspendido ? "Reactivar" : "Suspender"}</button>
                </form>
              )}
            </td>
          </tr>
        ))}
      </Tabla>
      <p className="text-xs text-slate-500">Para dar rol de abogado con perfil en el directorio, aprueba su solicitud en “Solicitudes”.</p>
    </div>
  );
}
