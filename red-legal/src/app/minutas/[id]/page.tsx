import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { MINUTAS, minuta } from "@/lib/minutas";
import { Formato } from "./formato";

export const generateStaticParams = () => MINUTAS.map((m) => ({ id: m.id }));

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }): Promise<Metadata> {
  const m = minuta((await params).id);
  return { title: m ? `${m.titulo} · Minutas Red Legal DOMINET` : "Minuta" };
}

export default async function PaginaMinuta({ params }: { params: Promise<{ id: string }> }) {
  const m = minuta((await params).id);
  if (!m) notFound();
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
      <Formato minuta={m} />
    </div>
  );
}
