import Link from "next/link";
import { AREAS } from "@/lib/areas";

const PASOS = [
  { t: "Cuéntanos tu caso", d: "Un asistente con IA entiende tu necesidad e identifica el área del derecho y la urgencia. Gratis." },
  { t: "Recibe un concepto", d: "Si lo necesitas, un abogado inscrito revisa y firma un concepto preliminar sobre tu caso." },
  { t: "Elige tu abogado", d: "Te sugerimos tres especialistas según costo, urgencia y calificación. Tú decides." },
];

export default function Home() {
  return (
    <div className="space-y-12">
      <section className="space-y-4">
        <h1 className="text-3xl font-bold text-blue-900">Orientación legal clara y abogados verificados</h1>
        <p className="max-w-2xl text-slate-600">
          Entiende tu situación en minutos y conecta con un abogado especializado en Colombia.
        </p>
        <div className="flex flex-wrap gap-3">
          <Link href="/orientacion" className="rounded-md bg-blue-900 px-5 py-3 text-white">Tengo un problema legal</Link>
          <Link href="/abogados/registro" className="rounded-md border border-blue-900 px-5 py-3 text-blue-900">Soy abogado</Link>
        </div>
      </section>

      <section className="grid gap-4 sm:grid-cols-3">
        {PASOS.map((p, i) => (
          <div key={p.t} className="rounded-lg border bg-white p-5">
            <p className="text-sm text-slate-500">Paso {i + 1}</p>
            <h2 className="font-semibold">{p.t}</h2>
            <p className="mt-1 text-sm text-slate-600">{p.d}</p>
          </div>
        ))}
      </section>

      <section>
        <h2 className="mb-3 text-xl font-semibold">Áreas del derecho</h2>
        <ul className="grid gap-2 sm:grid-cols-3">
          {AREAS.map((a) => (
            <li key={a.id} className="rounded-md border bg-white px-4 py-3 text-sm">
              <span className="font-medium">{a.nombre}</span>
              <span className="block text-slate-500">{a.ejemplos}</span>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
