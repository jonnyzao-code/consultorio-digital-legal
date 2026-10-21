import type { Metadata } from "next";
import Link from "next/link";
import { PLANES } from "@/lib/planes";

export const metadata: Metadata = { title: "Planes para abogados · Red Legal DOMINET" };

export default function Planes() {
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Planes para abogados</h1>
        <p className="text-sm text-slate-600">Fundadores: 50% de descuento por 6 meses. Pago anual: 2 meses gratis. Precios más IVA.</p>
      </div>
      <div className="grid gap-4 sm:grid-cols-3">
        {PLANES.map((p) => (
          <section key={p.id} className={`rounded-lg border bg-white p-5 ${p.id === "profesional" ? "border-blue-900 ring-1 ring-blue-900" : ""}`}>
            {p.id === "profesional" && <p className="mb-1 text-xs font-semibold uppercase text-blue-900">Recomendado</p>}
            <h2 className="text-lg font-semibold">{p.nombre}</h2>
            <p className="mb-3 text-2xl font-bold text-blue-900">{p.precio}</p>
            <ul className="space-y-1 text-sm text-slate-700">
              {p.servicios.map((s) => <li key={s}>✓ {s}</li>)}
            </ul>
          </section>
        ))}
      </div>
      <div className="flex flex-wrap gap-3 text-sm">
        <Link href="/abogados/registro" className="rounded-md bg-blue-900 px-5 py-3 text-white">Inscribirme</Link>
        <Link href="/terminos/abogados" className="rounded-md border px-5 py-3">Leer el contrato</Link>
      </div>
    </div>
  );
}
