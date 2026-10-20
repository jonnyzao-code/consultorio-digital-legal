"use client";

import { useActionState } from "react";
import { AREAS } from "@/lib/areas";
import { registrarAbogado, type Estado } from "./actions";

const PLANES = [
  { id: "basico", nombre: "Básico", precio: "$49.900/mes" },
  { id: "profesional", nombre: "Profesional", precio: "$99.900/mes" },
  { id: "firma", nombre: "Firma (hasta 5)", precio: "$249.900/mes" },
];
const campo = "w-full rounded-md border bg-white p-2";

export default function RegistroAbogado() {
  const [estado, accion, enviando] = useActionState<Estado, FormData>(registrarAbogado, { ok: false, mensaje: "" });

  if (estado.ok) return <p className="mx-auto max-w-xl rounded-md bg-green-50 p-5 text-green-900">{estado.mensaje}</p>;

  return (
    <form action={accion} className="mx-auto max-w-xl space-y-4">
      <h1 className="text-2xl font-bold text-blue-900">Únete a la red de abogados</h1>
      <p className="text-sm text-slate-600">Fundadores: 50% de descuento por 6 meses. Verificamos tu tarjeta profesional antes de activar el perfil.</p>
      <input name="nombre" placeholder="Nombre completo" required className={campo} />
      <input name="email" type="email" placeholder="Correo" required className={campo} />
      <input name="telefono" placeholder="Celular" required className={campo} />
      <input name="ciudad" placeholder="Ciudad" required className={campo} />
      <input name="tarjeta_profesional" placeholder="Número de tarjeta profesional" required className={campo} />
      <fieldset>
        <legend className="mb-2 font-medium">Áreas (máximo 3)</legend>
        <div className="grid grid-cols-2 gap-1 text-sm">
          {AREAS.map((a) => (
            <label key={a.id} className="flex gap-2"><input type="checkbox" name="areas" value={a.id} />{a.nombre}</label>
          ))}
        </div>
      </fieldset>
      <fieldset>
        <legend className="mb-2 font-medium">Plan</legend>
        {PLANES.map((p) => (
          <label key={p.id} className="flex gap-2 text-sm">
            <input type="radio" name="plan" value={p.id} defaultChecked={p.id === "profesional"} />
            {p.nombre} · {p.precio}
          </label>
        ))}
      </fieldset>
      <input name="codigo_referido" placeholder="Código de referido (opcional)" className={campo} />
      <label className="flex gap-2 text-sm"><input type="checkbox" name="acepta_contrato" required />Acepto el contrato de vinculación de abogados.</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="autoriza_datos" required />Autorizo el tratamiento de mis datos (Ley 1581 de 2012).</label>
      <button disabled={enviando} className="rounded-md bg-blue-900 px-5 py-3 text-white disabled:opacity-50">
        {enviando ? "Enviando…" : "Enviar solicitud"}
      </button>
      {estado.mensaje && <p className="text-sm text-red-700">{estado.mensaje}</p>}
    </form>
  );
}
