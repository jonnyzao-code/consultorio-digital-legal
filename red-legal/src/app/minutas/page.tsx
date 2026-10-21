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
      <div>
        <h1 className="text-2xl font-bold text-blue-900">Minutas y formatos jurídicos</h1>
        <p className="text-sm text-slate-600">
          Llene el formulario, revise el texto y descárguelo en Word o PDF. Cada minuta tiene un precio por documento (IVA incluido, acceso por 30 días)
          y están incluidas en los <Link href="/planes" className="underline">planes de abogados</Link>. Son modelos con base en la ley colombiana
          vigente: adáptelos a su caso o pida la revisión de un abogado.
        </p>
      </div>
      {grupos.map((g) => (
        <section key={g.id}>
          <h2 className="mb-2 font-semibold">{g.nombre}</h2>
          <div className="grid gap-3 sm:grid-cols-2">
            {g.items.map((m) => (
              <Link key={m.id} href={`/minutas/${m.id}`} className="rounded-lg border bg-white p-4 hover:border-blue-900">
                <p className="flex justify-between gap-2 font-medium text-blue-900"><span>{m.titulo}</span><span className="shrink-0">{pesos(precioMinuta(m.id))}</span></p>
                <p className="text-sm text-slate-600">{m.descripcion}</p>
                <p className="mt-1 text-xs text-slate-500">{m.baseLegal}</p>
              </Link>
            ))}
          </div>
        </section>
      ))}
    </div>
  );
}
