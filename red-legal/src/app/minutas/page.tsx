import type { Metadata } from "next";
import Link from "next/link";
import { CATEGORIAS, MINUTAS } from "@/lib/minutas";
import { pesos, precioMinuta } from "@/lib/minutas/precios";

export const metadata: Metadata = { title: "Minutas y formatos jurídicos · Red Legal DOMINET" };

export default function Minutas() {
  const grupos = Object.entries(CATEGORIAS)
    .map(([id, nombre]) => ({ id, nombre, items: MINUTAS.filter((m) => m.categoria === id) }))
    .filter((g) => g.items.length);

  return (
    <div className="space-y-8">
      <div className="max-w-3xl">
        <p className="text-sm font-semibold uppercase tracking-widest text-oro-600">Biblioteca jurídica</p>
        <h1 className="mt-2 text-4xl text-blue-900">Minutas y formatos jurídicos</h1>
        <p className="mt-3 text-slate-600">
          Llene el formulario, revise el texto y descárguelo en Word o PDF. Cada minuta tiene un precio por documento (IVA incluido, acceso por 30 días)
          y están incluidas en los <Link href="/planes" className="underline">planes de abogados</Link>. Son modelos con base en la ley colombiana
          vigente: adáptelos a su caso o pida la revisión de un abogado.
        </p>
      </div>
      {grupos.map((g) => (
        <section key={g.id}>
          <h2 className="titulo mb-4 text-2xl text-blue-900">{g.nombre}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {g.items.map((m) => (
              <Link key={m.id} href={`/minutas/${m.id}`} className="group flex flex-col rounded-2xl border border-slate-200 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:border-oro-400 hover:shadow-lg">
                <p className="font-semibold text-blue-900">{m.titulo}</p>
                <p className="mt-1 flex-1 text-sm text-slate-600">{m.descripcion}</p>
                <p className="mt-3 text-xs text-slate-400">{m.baseLegal}</p>
                <p className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
                  <span className="font-[family-name:var(--font-display)] text-xl text-blue-900">{pesos(precioMinuta(m.id))}</span>
                  <span className="font-semibold text-oro-600 group-hover:underline">Ver minuta →</span>
                </p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
