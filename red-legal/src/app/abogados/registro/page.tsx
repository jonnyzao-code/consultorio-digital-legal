"use client";

import { useActionState } from "react";
import Link from "next/link";
import { AREAS } from "@/lib/areas";
import { PLANES } from "@/lib/planes";
import { registrarAbogado, type Estado } from "./actions";

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
        <div className="grid gap-2 sm:grid-cols-3">
          {PLANES.map((p) => (
            <label key={p.id} className="flex cursor-pointer flex-col gap-1 rounded-md border bg-white p-3 text-sm has-[:checked]:border-blue-900 has-[:checked]:ring-1 has-[:checked]:ring-blue-900">
              <span className="flex items-center gap-2 font-medium">
                <input type="radio" name="plan" value={p.id} defaultChecked={p.id === "profesional"} />
                {p.nombre}
              </span>
              <span className="text-blue-900">{p.precio}</span>
              <ul className="list-disc pl-4 text-xs text-slate-600">{p.servicios.map((x) => <li key={x}>{x}</li>)}</ul>
            </label>
          ))}
        </div>
        <p className="mt-1 text-xs text-slate-500">Precios más IVA. Anual: 2 meses gratis. <Link href="/planes" className="underline">Comparar planes</Link></p>
      </fieldset>
      <input name="codigo_referido" placeholder="Código de referido (opcional)" className={campo} />
      <label className="flex gap-2 text-sm"><input type="checkbox" name="acepta_contrato" required /><span>Acepto el <Link href="/terminos/abogados" target="_blank" className="underline">contrato de vinculación de abogados</Link>.</span></label>
      <label className="flex gap-2 text-sm"><input type="checkbox" name="autoriza_datos" required /><span>Autorizo el <Link href="/terminos/datos" target="_blank" className="underline">tratamiento de mis datos</Link> (Ley 1581 de 2012).</span></label>
      <button disabled={enviando} className="rounded-md bg-blue-900 px-5 py-3 text-white disabled:opacity-50">
        {enviando ? "Enviando…" : "Enviar solicitud"}
      </button>
      {estado.mensaje && <p className="text-sm text-red-700">{estado.mensaje}</p>}
    </form>
  );
}
