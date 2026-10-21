"use client";

import { useMemo, useState } from "react";
import { llenar, type Minuta } from "@/lib/minutas";

const campo = "w-full rounded-md border bg-white p-2 text-sm";

// Las fechas del formulario (AAAA-MM-DD) se escriben en letras: "21 de octubre de 2026".
const fechaLarga = (v: string) =>
  /^\d{4}-\d{2}-\d{2}$/.test(v) ? new Date(`${v}T12:00:00`).toLocaleDateString("es-CO", { day: "numeric", month: "long", year: "numeric" }) : v;

export function Formato({ minuta }: { minuta: Minuta }) {
  const [valores, setValores] = useState<Record<string, string>>({});
  const [copiado, setCopiado] = useState(false);

  const texto = useMemo(() => {
    const listos = Object.fromEntries(
      minuta.campos.map((c) => [c.id, c.tipo === "fecha" ? fechaLarga(valores[c.id] ?? "") : (valores[c.id] ?? "")]),
    );
    return llenar(minuta.texto, listos);
  }, [minuta, valores]);

  const descargarWord = () => {
    const escapado = texto.replace(/&/g, "&amp;").replace(/</g, "&lt;");
    const html = `<html><head><meta charset="utf-8"></head><body><pre style="font-family:'Times New Roman';font-size:12pt;white-space:pre-wrap">${escapado}</pre></body></html>`;
    const url = URL.createObjectURL(new Blob(["﻿", html], { type: "application/msword" }));
    const a = Object.assign(document.createElement("a"), { href: url, download: `${minuta.id}.doc` });
    a.click();
    URL.revokeObjectURL(url);
  };

  const copiar = async () => {
    await navigator.clipboard.writeText(texto);
    setCopiado(true);
    setTimeout(() => setCopiado(false), 2000);
  };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <form className="space-y-3 print:hidden" onSubmit={(e) => e.preventDefault()}>
        {minuta.campos.map((c) => (
          <label key={c.id} className="block text-sm">
            <span className="mb-1 block font-medium">{c.etiqueta}</span>
            {c.tipo === "parrafo" ? (
              <textarea rows={4} placeholder={c.ejemplo} className={campo} value={valores[c.id] ?? ""} onChange={(e) => setValores({ ...valores, [c.id]: e.target.value })} />
            ) : (
              <input
                type={c.tipo === "fecha" ? "date" : "text"}
                inputMode={c.tipo === "numero" || c.tipo === "dinero" ? "numeric" : undefined}
                placeholder={c.ejemplo}
                className={campo}
                value={valores[c.id] ?? ""}
                onChange={(e) => setValores({ ...valores, [c.id]: e.target.value })}
              />
            )}
          </label>
        ))}
      </form>
      <div className="space-y-3 lg:sticky lg:top-4 lg:self-start">
        <div className="flex flex-wrap gap-2 text-sm print:hidden">
          <button type="button" onClick={descargarWord} className="rounded-md bg-blue-900 px-4 py-2 text-white">Descargar Word</button>
          <button type="button" onClick={() => window.print()} className="rounded-md border px-4 py-2">Imprimir o guardar PDF</button>
          <button type="button" onClick={copiar} className="rounded-md border px-4 py-2">{copiado ? "Copiado ✓" : "Copiar texto"}</button>
        </div>
        <pre className="max-h-[75vh] overflow-auto whitespace-pre-wrap rounded-lg border bg-white p-5 font-serif text-sm leading-relaxed print:max-h-none print:overflow-visible print:border-0 print:p-0">{texto}</pre>
        <p className="text-xs text-slate-500 print:hidden">Modelo de referencia. No reemplaza la asesoría de un abogado.</p>
      </div>
    </div>
  );
}
