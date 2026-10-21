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
];

export default async function LayoutAdmin({ children }: { children: React.ReactNode }) {
  await exigirAdmin();
  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center gap-2 border-b pb-3">
        <h1 className="mr-4 text-xl font-bold text-blue-900">Administración</h1>
        {SECCIONES.map(([href, nombre]) => (
          <Link key={href} href={href} className="rounded-md px-3 py-1 text-sm hover:bg-slate-200">{nombre}</Link>
        ))}
      </div>
      {children}
    </div>
  );
}
