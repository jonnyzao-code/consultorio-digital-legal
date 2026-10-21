import Link from "next/link";
import { exigirAdmin } from "@/lib/admin";

const SECCIONES = [
  ["/admin", "Resumen"],
  ["/admin/cuentas", "Cuentas y permisos"],
  ["/admin/solicitudes", "Solicitudes"],
  ["/admin/abogados", "Abogados"],
  ["/admin/pagos", "Pagos"],
  ["/admin/minutas", "Minutas"],
  ["/admin/bitacora", "Bitácora"],
  ["/panel/cuenta", "Mi contraseña"],
];

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 rounded-2xl bg-tinta p-3 text-slate-300 shadow-lg">
        <h1 className="mr-4 px-2 text-xl text-oro-300">Administración</h1>
        {SECCIONES.map(([href, nombre]) => (
          <Link key={href} href={href} className="rounded-lg px-3 py-1.5 text-sm hover:bg-white/10 hover:text-white">{nombre}</Link>
        ))}
      </div>
      {children}
    </div>
  );
}
