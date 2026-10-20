"use client";

import { useActionState } from "react";
import { enviarEnlace } from "./actions";

export default function Ingresar() {
  const [mensaje, accion, enviando] = useActionState(enviarEnlace, "");
  return (
    <form action={accion} className="mx-auto max-w-sm space-y-4">
      <h1 className="text-2xl font-bold text-blue-900">Ingresar</h1>
      <input name="email" type="email" required placeholder="Tu correo" className="w-full rounded-md border bg-white p-2" />
      <button disabled={enviando} className="w-full rounded-md bg-blue-900 px-5 py-3 text-white disabled:opacity-50">
        Enviar enlace de acceso
      </button>
      {mensaje && <p className="text-sm text-slate-700">{mensaje}</p>}
    </form>
  );
}
