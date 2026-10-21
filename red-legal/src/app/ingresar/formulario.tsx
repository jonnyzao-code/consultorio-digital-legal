"use client";

import { useActionState, useState } from "react";
import { enviarEnlace, ingresarConClave } from "./actions";

const campo = "w-full rounded-lg border border-slate-300 bg-white px-3 py-2.5 outline-none focus:border-blue-900 focus:ring-2 focus:ring-blue-900/15";

export function FormularioIngreso({ siguiente }: { siguiente?: string }) {
  const [modo, setModo] = useState<"clave" | "enlace">("clave");
  const [mensajeClave, accionClave, entrando] = useActionState(ingresarConClave, "");
  const [mensajeEnlace, accionEnlace, enviando] = useActionState(enviarEnlace, "");
  const pestana = (m: typeof modo) => `flex-1 rounded-md px-3 py-2 text-sm font-medium ${modo === m ? "bg-white text-blue-900 shadow" : "text-slate-500"}`;

  return (
    <div className="mx-auto max-w-md rounded-2xl border bg-white p-8 shadow-xl shadow-slate-200/60">
      <h1 className="text-3xl text-blue-900">Ingresar</h1>
      <p className="mt-1 text-sm text-slate-500">Clientes, abogados y administradores.</p>
      <div className="mt-6 flex gap-1 rounded-lg bg-slate-100 p-1">
        <button type="button" onClick={() => setModo("clave")} className={pestana("clave")}>Con contraseña</button>
        <button type="button" onClick={() => setModo("enlace")} className={pestana("enlace")}>Con enlace al correo</button>
      </div>
      {modo === "clave" ? (
        <form action={accionClave} className="mt-6 space-y-4">
          {siguiente && <input type="hidden" name="siguiente" value={siguiente} />}
          <input name="email" type="email" required autoComplete="email" placeholder="Correo" className={campo} />
          <input name="clave" type="password" required autoComplete="current-password" placeholder="Contraseña" className={campo} />
          <button disabled={entrando} className="w-full rounded-lg bg-blue-900 px-5 py-3 font-medium text-white hover:bg-blue-950 disabled:opacity-50">
            {entrando ? "Ingresando…" : "Ingresar"}
          </button>
          {mensajeClave && <p className="text-sm text-red-700">{mensajeClave}</p>}
          <p className="text-xs text-slate-500">¿Primera vez u olvidaste la contraseña? Usa “Con enlace al correo” y luego créala en Mi cuenta.</p>
        </form>
      ) : (
        <form action={accionEnlace} className="mt-6 space-y-4">
          {siguiente && <input type="hidden" name="siguiente" value={siguiente} />}
          <input name="email" type="email" required autoComplete="email" placeholder="Correo" className={campo} />
          <button disabled={enviando} className="w-full rounded-lg bg-blue-900 px-5 py-3 font-medium text-white hover:bg-blue-950 disabled:opacity-50">
            Enviar enlace de acceso
          </button>
          {mensajeEnlace && <p className="text-sm text-slate-700">{mensajeEnlace}</p>}
        </form>
      )}
    </div>
  );
}
