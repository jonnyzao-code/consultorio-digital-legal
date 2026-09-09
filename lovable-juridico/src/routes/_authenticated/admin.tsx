import { createFileRoute, Link } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useEffect, useState } from "react";
import {
  listarUsuarios,
  cambiarPlan,
  type UsuarioAdmin,
} from "@/lib/admin.functions";

export const Route = createFileRoute("/_authenticated/admin")({
  head: () => ({
    meta: [
      { title: "Administración de usuarios | Vigilancia judicial" },
      {
        name: "description",
        content:
          "Panel del administrador para revisar usuarios registrados y asignarles plan gratis o pago.",
      },
      { property: "og:title", content: "Administración de usuarios" },
      {
        property: "og:description",
        content: "Gestión de cuentas y planes del servicio de vigilancia judicial.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Admin,
  errorComponent: ({ error }) => (
    <main className="min-h-screen bg-background px-4 py-16">
      <p className="mx-auto max-w-lg text-center text-sm text-muted-foreground">
        {error.message}
      </p>
    </main>
  ),
});

function Admin() {
  const cargar = useServerFn(listarUsuarios);
  const cambiar = useServerFn(cambiarPlan);
  const [usuarios, setUsuarios] = useState<UsuarioAdmin[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    void cargar()
      .then(setUsuarios)
      .catch((e: Error) => setError(e.message));
  }, [cargar]);

  const set = async (u: UsuarioAdmin, plan: "free" | "pago") => {
    await cambiar({ data: { userId: u.id, plan } });
    setUsuarios((prev) =>
      prev.map((x) => (x.id === u.id ? { ...x, plan } : x)),
    );
  };

  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <Link to="/panel" className="text-sm text-muted-foreground hover:underline">
          ← Volver al panel
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-foreground">
          Usuarios registrados
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Asigna a cada usuario el plan gratis (1 día por proceso) o pago (30
          días por proceso).
        </p>

        {error && (
          <p className="mt-6 rounded-md bg-muted p-3 text-sm text-foreground">
            {error}
          </p>
        )}

        <ul className="mt-6 space-y-3">
          {usuarios.map((u) => (
            <li
              key={u.id}
              className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <div className="min-w-0">
                <p className="text-sm font-semibold text-card-foreground">
                  {u.nombre_completo || "(sin nombre)"}
                </p>
                <p className="text-xs text-muted-foreground">
                  {u.email} · {u.documento || "sin documento"} ·{" "}
                  {u.telefono || "sin teléfono"} · {u.ciudad || "—"} ·{" "}
                  {u.procesos} proceso(s)
                </p>
              </div>
              <div className="flex items-center gap-2">
                <span className="rounded-full border border-border px-3 py-1 text-xs font-semibold text-foreground">
                  {u.plan === "pago" ? "Pago" : "Gratis"}
                </span>
                <button
                  onClick={() => void set(u, u.plan === "pago" ? "free" : "pago")}
                  className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                >
                  Cambiar a {u.plan === "pago" ? "gratis" : "pago"}
                </button>
              </div>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}
