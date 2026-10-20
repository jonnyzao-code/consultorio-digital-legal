"use client";

import { useState } from "react";
import { AREAS } from "@/lib/areas";
import type { Triage } from "@/lib/triage";
import { pagarConcepto } from "@/app/pagos/actions";

const nombreArea = (id: string) => AREAS.find((a) => a.id === id)?.nombre ?? id;
const colorUrgencia = { alta: "bg-red-100 text-red-800", media: "bg-amber-100 text-amber-800", baja: "bg-green-100 text-green-800" };

export default function Orientacion() {
  const [texto, setTexto] = useState("");
  const [autoriza, setAutoriza] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState("");
  const [resultado, setResultado] = useState<Triage | null>(null);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    setCargando(true);
    setError("");
    try {
      const res = await fetch("/api/orientacion", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: [{ role: "user", content: texto }], autoriza_datos: autoriza }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResultado(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error inesperado");
    } finally {
      setCargando(false);
    }
  }

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <h1 className="text-2xl font-bold text-blue-900">Cuéntanos tu caso</h1>
      <p className="text-sm text-slate-600">
        Esta orientación es informativa y gratuita. No reemplaza el concepto de un abogado.
      </p>

      <form onSubmit={enviar} className="space-y-4">
        <textarea
          value={texto}
          onChange={(e) => setTexto(e.target.value)}
          rows={7}
          required
          minLength={30}
          placeholder="Describe qué pasó, desde cuándo, quiénes están involucrados y si tienes alguna fecha límite."
          className="w-full rounded-md border bg-white p-3"
        />
        <label className="flex gap-2 text-sm">
          <input type="checkbox" checked={autoriza} onChange={(e) => setAutoriza(e.target.checked)} required />
          Autorizo el tratamiento de mis datos según la política de tratamiento de datos (Ley 1581 de 2012).
        </label>
        <button disabled={cargando || !autoriza} className="rounded-md bg-blue-900 px-5 py-3 text-white disabled:opacity-50">
          {cargando ? "Analizando…" : "Obtener orientación"}
        </button>
        {error && <p className="text-sm text-red-700">{error}</p>}
      </form>

      {resultado && (
        <section className="space-y-4 rounded-lg border bg-white p-5">
          <div className="flex flex-wrap items-center gap-2">
            {resultado.areas.map((a) => (
              <span key={a} className="rounded-full bg-blue-100 px-3 py-1 text-sm text-blue-900">{nombreArea(a)}</span>
            ))}
            <span className={`rounded-full px-3 py-1 text-sm ${colorUrgencia[resultado.urgencia]}`}>
              Urgencia {resultado.urgencia}
            </span>
          </div>
          <p>{resultado.resumen}</p>
          <p className="text-sm text-slate-600">{resultado.motivo_urgencia}</p>
          <div>
            <h2 className="font-semibold">Pasos generales</h2>
            <ul className="list-disc pl-5 text-sm">{resultado.orientacion_general.map((o) => <li key={o}>{o}</li>)}</ul>
          </div>
          {resultado.preguntas_pendientes.length > 0 && (
            <div>
              <h2 className="font-semibold">Lo que un abogado necesitará saber</h2>
              <ul className="list-disc pl-5 text-sm">{resultado.preguntas_pendientes.map((p) => <li key={p}>{p}</li>)}</ul>
            </div>
          )}
          <div className="rounded-md bg-slate-100 p-4 text-sm">
            <p className="font-semibold">Concepto preliminar firmado por abogado: $39.900 + IVA</p>
            <p>Incluye revisión de tu caso y tres abogados sugeridos del área. Pagas con PSE, Nequi o tarjeta.</p>
            <form action={pagarConcepto.bind(null, resultado)} className="mt-3">
              <button className="rounded-md bg-blue-900 px-4 py-2 text-white">Solicitar concepto</button>
            </form>
          </div>
        </section>
      )}
    </div>
  );
}
