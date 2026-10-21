import type { Metadata } from "next";
import Link from "next/link";
import { PLANES } from "@/lib/planes";

export const metadata: Metadata = { title: "Planes para abogados · Red Legal DOMINET" };

export default function Planes() {
  return (
    <div className="space-y-12">
      <div className="mx-auto max-w-2xl text-center">
        <p className="text-sm font-semibold uppercase tracking-widest text-oro-600">Planes para abogados</p>
        <h1 className="mt-2 text-4xl text-blue-900">Elige el plan de tu despacho</h1>
        <p className="mt-3 text-slate-600">Fundadores: 50% de descuento por 6 meses. Pago anual: 2 meses gratis. Precios más IVA.</p>
      </div>
      <div className="grid gap-6 lg:grid-cols-3">
        {PLANES.map((p) => {
          const destacado = p.id === "profesional";
          return (
            <section key={p.id} className={`relative flex flex-col rounded-3xl p-8 ${destacado ? "fondo-hero text-white shadow-2xl shadow-blue-900/30 lg:-translate-y-3" : "border border-slate-200 bg-white shadow-sm"}`}>
              {destacado && <p className="absolute -top-3 left-8 rounded-full bg-gradient-to-r from-oro-400 to-oro-500 px-3 py-1 text-xs font-bold uppercase text-tinta">Recomendado</p>}
              <h2 className={`text-lg font-semibold ${destacado ? "text-oro-300" : "text-blue-900"}`}>{p.nombre}</h2>
              <p className="mt-3 font-[family-name:var(--font-display)] text-4xl">
                {p.precio.replace("/mes", "")}<span className={`text-sm ${destacado ? "text-slate-300" : "text-slate-500"}`}> /mes</span>
              </p>
              <ul className={`mt-6 flex-1 space-y-3 text-sm ${destacado ? "text-slate-200" : "text-slate-700"}`}>
                {p.servicios.map((s) => (
                  <li key={s} className="flex gap-2"><span className={destacado ? "text-oro-400" : "text-oro-600"}>✓</span> {s}</li>
                ))}
              </ul>
              <Link href="/abogados/registro" className={`mt-8 rounded-xl px-5 py-3 text-center font-semibold ${destacado ? "bg-gradient-to-r from-oro-400 to-oro-500 text-tinta" : "bg-blue-900 text-white hover:bg-blue-950"}`}>
                Inscribirme
              </Link>
            </section>
          );
        })}
      </div>
      <p className="text-center text-sm text-slate-600">
        Antes de inscribirte puedes leer el <Link href="/terminos/abogados" className="font-semibold text-blue-900 underline">contrato de vinculación</Link>.
      </p>
    </div>
  );
}
