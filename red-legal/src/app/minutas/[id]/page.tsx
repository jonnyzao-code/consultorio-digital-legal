import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { minuta } from "@/lib/minutas";
import { accesoMinuta } from "@/lib/minutas/acceso";
import { pesos, precioMinuta } from "@/lib/minutas/precios";
import { pagarMinuta, usarPlan } from "../actions";
import { Formato } from "./formato";

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const m = minuta((await params).id);
  return { title: m ? `${m.titulo} · Minutas Red Legal DOMINET` : "Minuta" };
}

// Sin acceso solo se envía al navegador el comienzo del texto: el resto nunca sale del servidor.
const vistaPrevia = (texto: string) => {
  const lineas = texto.split("\n");
  return `${lineas.slice(0, Math.max(12, Math.ceil(lineas.length * 0.35))).join("\n")}\n\n[…] El documento completo se habilita al comprarlo o con tu plan de abogado.`;
};

export default async function PaginaMinuta({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ error?: string; pago?: string }> }) {
  const m = minuta((await params).id);
  if (!m) notFound();
  const { error, pago } = await searchParams;
  const acceso = await accesoMinuta(m.id);
  const precio = precioMinuta(m.id);
  const libre = acceso.tipo === "libre";

  return (
    <div className="space-y-4">
      <div className="print:hidden">
        <Link href="/minutas" className="text-sm text-blue-900 underline">← Todas las minutas</Link>
        <h1 className="mt-2 text-2xl font-bold text-blue-900">{m.titulo}</h1>
        <p className="text-sm text-slate-600">{m.descripcion}</p>
        <p className="mt-1 text-xs text-slate-500">Base legal: {m.baseLegal}</p>
        <ul className="mt-3 list-disc space-y-1 rounded-md bg-amber-50 p-3 pl-7 text-sm text-amber-900">
          {m.notas.map((n) => <li key={n}>{n}</li>)}
        </ul>
      </div>

      {error && <p className="rounded bg-red-50 p-2 text-sm text-red-800 print:hidden">{error}</p>}
      {libre ? (
        acceso.vence && <p className="text-sm text-green-800 print:hidden">Tienes acceso a esta minuta hasta el {acceso.vence}.</p>
      ) : (
        <div className="flex flex-wrap items-center gap-3 rounded-lg border border-blue-900 bg-white p-4 text-sm print:hidden">
          {pago && <p className="w-full text-amber-800">Estamos confirmando tu pago con Wompi. Recarga la página en unos segundos.</p>}
          <p className="flex-1">
            <span className="font-semibold">{pesos(precio)}</span> IVA incluido · acceso por 30 días para editar y descargar en Word o PDF.
            Incluida en los <Link href="/planes" className="underline">planes de abogados</Link>.
          </p>
          {acceso.tipo === "plan" ? (
            <form action={usarPlan.bind(null, m.id)}>
              <button className="rounded-md bg-blue-900 px-4 py-2 text-white">
                Usar mi plan{acceso.limite !== null ? ` (${acceso.usados} de ${acceso.limite} este mes)` : ""}
              </button>
            </form>
          ) : acceso.conSesion ? (
            <form action={pagarMinuta.bind(null, m.id)}>
              <button className="rounded-md bg-blue-900 px-4 py-2 text-white">Comprar por {pesos(precio)}</button>
            </form>
          ) : (
            <Link href={`/ingresar?siguiente=/minutas/${m.id}`} className="rounded-md bg-blue-900 px-4 py-2 text-white">Ingresar para comprar</Link>
          )}
        </div>
      )}

      <Formato minuta={libre ? m : { ...m, texto: vistaPrevia(m.texto) }} bloqueado={!libre} />
    </div>
  );
}
