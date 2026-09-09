import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import { miPerfil, actualizarPerfil, type Perfil } from "@/lib/casos.functions";

export const Route = createFileRoute("/_authenticated/cuenta")({
  head: () => ({
    meta: [
      { title: "Mis datos de registro | Vigilancia judicial" },
      {
        name: "description",
        content:
          "Actualiza tus datos de registro: nombre, documento, teléfono, ciudad y tarjeta profesional.",
      },
      { property: "og:title", content: "Mis datos de registro" },
      {
        property: "og:description",
        content: "Datos de la cuenta del servicio de vigilancia de procesos judiciales.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Cuenta,
});

const input =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

function Cuenta() {
  const cargar = useServerFn(miPerfil);
  const guardar = useServerFn(actualizarPerfil);
  const [p, setP] = useState<Perfil | null>(null);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    void cargar().then(setP);
  }, [cargar]);

  if (!p) {
    return (
      <main className="min-h-screen bg-background px-4 py-16">
        <p className="text-center text-sm text-muted-foreground">Cargando…</p>
      </main>
    );
  }

  const campo = (
    label: string,
    key: keyof Perfil,
    tipo = "text",
  ) => (
    <div>
      <label className="mb-1 block text-sm font-medium text-foreground">
        {label}
      </label>
      <input
        type={tipo}
        value={String(p[key] ?? "")}
        onChange={(e) => setP({ ...p, [key]: e.target.value })}
        className={input}
      />
    </div>
  );

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-2xl">
        <Link to="/panel" className="text-sm text-muted-foreground hover:underline">
          ← Volver al panel
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground">Mis datos</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Correo: {p.email} · Plan actual:{" "}
          <span className="font-semibold text-foreground">
            {p.plan === "pago" ? "pago" : "gratis"}
          </span>
        </p>

        <form
          onSubmit={async (e) => {
            e.preventDefault();
            await guardar({ data: p });
            setMsg("Datos actualizados.");
          }}
          className="mt-6 grid gap-4 rounded-xl border border-border bg-card p-6 shadow-sm sm:grid-cols-2"
        >
          <div className="sm:col-span-2">{campo("Nombre completo", "nombre_completo")}</div>
          {campo("Tipo de documento", "tipo_documento")}
          {campo("Número de documento", "documento")}
          {campo("Teléfono / WhatsApp", "telefono")}
          {campo("Ciudad", "ciudad")}
          {campo("Tarjeta profesional", "tarjeta_profesional")}
          {campo("Firma / despacho", "despacho")}
          <div className="sm:col-span-2">
            <button
              type="submit"
              className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Guardar cambios
            </button>
          </div>
        </form>
        {msg && (
          <p className="mt-4 rounded-md bg-muted p-3 text-sm text-foreground">
            {msg}
          </p>
        )}
      </div>
    </main>
  );
}
