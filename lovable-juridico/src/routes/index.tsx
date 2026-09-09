import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Vigilancia automática de procesos judiciales en Colombia" },
      {
        name: "description",
        content:
          "Registra tus procesos civiles, penales y administrativos y recibe alertas automáticas de nuevas actuaciones en la Rama Judicial y la Fiscalía.",
      },
      {
        property: "og:title",
        content: "Vigilancia automática de procesos judiciales en Colombia",
      },
      {
        property: "og:description",
        content:
          "Crea tu cuenta, carga tus procesos y recibe alertas de actuaciones nuevas. Primer día gratis por proceso.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Landing,
});

function Landing() {
  const navigate = useNavigate();

  useEffect(() => {
    let activo = true;
    void supabase.auth.getSession().then(({ data }) => {
      if (activo && data.session) void navigate({ to: "/panel", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) void navigate({ to: "/panel", replace: true });
    });
    return () => {
      activo = false;
      sub.subscription.unsubscribe();
    };
  }, [navigate]);

  return (
    <main className="min-h-screen bg-background">
      <section className="mx-auto max-w-4xl px-4 py-20 text-center">
        <h1 className="text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
          Vigila tus procesos judiciales sin revisar los portales a mano
        </h1>
        <p className="mx-auto mt-5 max-w-2xl text-base text-muted-foreground">
          Carga tus casos civiles, penales y administrativos. El sistema los
          guarda en tu cuenta y los verifica de forma automática y periódica en
          la Rama Judicial, en las publicaciones procesales y en el SPOA de la
          Fiscalía, avisándote cuando hay una actuación nueva.
        </p>
        <div className="mt-8 flex flex-wrap justify-center gap-3">
          <Link
            to="/auth"
            className="rounded-md bg-primary px-6 py-3 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Crear cuenta
          </Link>
          <Link
            to="/auth"
            className="rounded-md border border-input px-6 py-3 text-sm font-semibold text-foreground hover:bg-accent"
          >
            Ya tengo cuenta
          </Link>
        </div>
      </section>

      <section className="mx-auto grid max-w-4xl gap-4 px-4 pb-20 sm:grid-cols-3">
        {[
          {
            t: "Registro completo",
            d: "Nombre, documento, teléfono, ciudad y tarjeta profesional para identificar cada cuenta.",
          },
          {
            t: "Revisión automática",
            d: "Tus procesos quedan almacenados y se consultan periódicamente; recibes alerta cuando cambian.",
          },
          {
            t: "Primer día gratis",
            d: "Cada proceso tiene 1 día de vigilancia gratis. Luego $10.000 COP por proceso durante 30 días, con pago seguro por Wompi.",
          },
        ].map((c) => (
          <div
            key={c.t}
            className="rounded-xl border border-border bg-card p-5 text-left shadow-sm"
          >
            <h2 className="text-sm font-semibold text-card-foreground">{c.t}</h2>
            <p className="mt-2 text-sm text-muted-foreground">{c.d}</p>
          </div>
        ))}
      </section>
    </main>
  );
}
