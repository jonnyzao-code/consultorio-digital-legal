"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { MensajeChat } from "@/lib/chat";

const SALUDO: MensajeChat = { role: "assistant", content: "¡Hola! Soy el asistente de Red Legal DOMINET. ¿En qué te ayudo? Puedo explicarte la orientación gratuita, las minutas o los planes para abogados." };

// Convierte las rutas internas que escribe el asistente (/minutas, /planes…) en enlaces.
function ConEnlaces({ texto }: { texto: string }) {
  return texto.split(/(\/[a-z][a-z0-9/-]*)/g).map((parte, i) =>
    /^\/[a-z]/.test(parte) ? <Link key={i} href={parte} className="underline">{parte}</Link> : <span key={i}>{parte}</span>,
  );
}

export function Chat() {
  const [abierto, setAbierto] = useState(false);
  const [mensajes, setMensajes] = useState<MensajeChat[]>([SALUDO]);
  const [texto, setTexto] = useState("");
  const [enviando, setEnviando] = useState(false);
  const fin = useRef<HTMLDivElement>(null);

  // Llaves: scrollIntoView puede devolver una promesa y React la tomaría como función de limpieza.
  useEffect(() => {
    fin.current?.scrollIntoView({ behavior: "smooth" });
  }, [mensajes, abierto]);

  async function enviar(e: React.FormEvent) {
    e.preventDefault();
    const pregunta = texto.trim();
    if (!pregunta || enviando) return;
    const historial = [...mensajes, { role: "user" as const, content: pregunta.slice(0, 800) }];
    setMensajes(historial);
    setTexto("");
    setEnviando(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ mensajes: historial.slice(1).slice(-19) }),
      });
      const data = await res.json();
      setMensajes([...historial, { role: "assistant", content: data.respuesta ?? data.error ?? "No pude responder. Intenta de nuevo." }]);
    } catch {
      setMensajes([...historial, { role: "assistant", content: "No pude conectarme. Intenta de nuevo en un momento." }]);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 print:hidden">
      {abierto && (
        <div className="mb-3 flex h-[28rem] w-[min(22rem,calc(100vw-2rem))] flex-col overflow-hidden rounded-xl border bg-white shadow-xl">
          <div className="flex items-center justify-between bg-blue-900 px-4 py-3 text-white">
            <p className="font-semibold">Asistente Red Legal</p>
            <button onClick={() => setAbierto(false)} aria-label="Cerrar" className="text-xl leading-none">×</button>
          </div>
          <div className="flex-1 space-y-2 overflow-y-auto p-3 text-sm">
            {mensajes.map((m, i) => (
              <p key={i} className={`max-w-[85%] whitespace-pre-wrap rounded-lg px-3 py-2 ${m.role === "user" ? "ml-auto bg-blue-900 text-white" : "bg-slate-100"}`}>
                {m.role === "assistant" ? <ConEnlaces texto={m.content} /> : m.content}
              </p>
            ))}
            {enviando && <p className="w-fit rounded-lg bg-slate-100 px-3 py-2 text-slate-500">Escribiendo…</p>}
            <div ref={fin} />
          </div>
          <form onSubmit={enviar} className="flex gap-2 border-t p-2">
            <input value={texto} onChange={(e) => setTexto(e.target.value)} maxLength={800} placeholder="Escribe tu pregunta" className="flex-1 rounded-md border p-2 text-sm" />
            <button disabled={enviando} className="rounded-md bg-blue-900 px-3 text-sm text-white disabled:opacity-50">Enviar</button>
          </form>
          <p className="px-3 pb-2 text-[10px] text-slate-500">Información general; no es asesoría jurídica. No compartas datos sensibles.</p>
        </div>
      )}
      <button onClick={() => setAbierto(!abierto)} className="ml-auto block rounded-full bg-blue-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
        {abierto ? "Cerrar chat" : "¿Necesitas ayuda?"}
      </button>
    </div>
  );
}
