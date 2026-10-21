"use client";

import { useActionState } from "react";
import { cambiarClave } from "./actions";

const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15";

export function FormularioClave() {
  const [mensaje, accion, guardando] = useActionState(cambiarClave, "");
  return (
    <form action={accion} className="space-y-4">
      <input name="clave" type="password" required minLength={8} autoComplete="new-password" placeholder="Nueva contraseña (mínimo 8)" className={campo} />
      <input name="confirmar" type="password" required minLength={8} autoComplete="new-password" placeholder="Repite la contraseña" className={campo} />
      <button disabled={guardando} className="rounded-lg bg-blue-900 px-5 py-3 font-medium text-white hover:bg-blue-950 disabled:opacity-50">Guardar contraseña</button>
      {mensaje && <p className="text-sm text-slate-700">{mensaje}</p>}
    </form>
  );
}
