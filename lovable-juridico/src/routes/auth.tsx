import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

export const Route = createFileRoute("/auth")({
  head: () => ({
    meta: [
      { title: "Crear cuenta o ingresar | Vigilancia de procesos judiciales" },
      {
        name: "description",
        content:
          "Regístrate con tus datos completos para cargar tus procesos judiciales y recibir alertas automáticas de actuaciones.",
      },
      { property: "og:title", content: "Crear cuenta o ingresar" },
      {
        property: "og:description",
        content:
          "Registro de abogados y usuarios para la vigilancia automática de procesos judiciales en Colombia.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Auth,
});

const input =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30";

/** Traduce los errores de Supabase a mensajes claros en español. */
function traducirError(err: unknown): string {
  const msg = err instanceof Error ? err.message : String(err ?? "");
  const lower = msg.toLowerCase();
  if (lower.includes("weak") || lower.includes("pwned") || lower.includes("too easy")) {
    return "La contraseña es débil o muy común. Usa una de 8+ caracteres con mayúsculas, números y símbolos.";
  }
  if (lower.includes("email not confirmed")) {
    return "Tu correo aún no está confirmado. Revisa tu bandeja de entrada y spam. En desarrollo, desactiva la confirmación en Supabase → Authentication → Sign In → Email (o configura SMTP).";
  }
  if (lower.includes("already registered") || lower.includes("already exists") || lower.includes("already in use")) {
    return "Ese correo ya está registrado. Usa 'Ingresar'.";
  }
  if (lower.includes("invalid login") || lower.includes("invalid credentials")) {
    return "Correo o contraseña incorrectos.";
  }
  if (lower.includes("rate") || lower.includes("too many") || lower.includes("blocked")) {
    return "Demasiados intentos. Espera un minuto e intenta de nuevo.";
  }
  return msg;
}

function Auth() {
  const navigate = useNavigate();
  const [modo, setModo] = useState<"registro" | "ingreso">("registro");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [nombre, setNombre] = useState("");
  const [tipoDocumento, setTipoDocumento] = useState("CC");
  const [documento, setDocumento] = useState("");
  const [telefono, setTelefono] = useState("");
  const [ciudad, setCiudad] = useState("");
  const [tarjeta, setTarjeta] = useState("");
  const [despacho, setDespacho] = useState("");
  const [msg, setMsg] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);

  useEffect(() => {
    void supabase.auth.getSession().then(({ data }) => {
      if (data.session) void navigate({ to: "/panel", replace: true });
    });
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      if (session) void navigate({ to: "/panel", replace: true });
    });
    return () => sub.subscription.unsubscribe();
  }, [navigate]);

  const enviar = async (e: React.FormEvent) => {
    e.preventDefault();
    setMsg(null);
    setCargando(true);
    try {
      if (modo === "ingreso") {
        const { error } = await supabase.auth.signInWithPassword({
          email,
          password,
        });
        if (error) throw error;
      } else {
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: `${window.location.origin}/panel`,
            data: {
              nombre_completo: nombre,
              tipo_documento: tipoDocumento,
              documento,
              telefono,
              ciudad,
              tarjeta_profesional: tarjeta,
              despacho,
            },
          },
        });
        if (error) throw error;
        if (!data.session) {
          setMsg(
            "Cuenta creada. Revisa tu correo y confirma el registro para ingresar.",
          );
        }
      }
    } catch (err) {
      setMsg(traducirError(err));
    } finally {
      setCargando(false);
    }
  };

  const conGoogle = async () => {
    setCargando(true);
    setMsg(null);
    // OAuth de Google directo de Supabase (el proveedor ya está habilitado en el
    // proyecto). No usa el broker de Lovable Cloud (solo existe en el dominio
    // de Lovable y por eso fallaba en el entorno local).
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/panel`,
      },
    });
    if (error) {
      setMsg("No fue posible iniciar con Google: " + traducirError(error));
      setCargando(false);
      return;
    }
    if (data?.url) {
      window.location.assign(data.url);
      return;
    }
    setCargando(false);
  };

  return (
    <main className="min-h-screen bg-background px-4 py-12">
      <div className="mx-auto max-w-xl">
        <Link to="/" className="text-sm text-muted-foreground hover:underline">
          ← Volver al inicio
        </Link>
        <h1 className="mt-4 text-3xl font-bold tracking-tight text-foreground">
          {modo === "registro" ? "Crear cuenta" : "Ingresar"}
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Con tu cuenta puedes cargar tus procesos y quedan guardados para
          verificarse de forma automática y periódica. El primer día de
          vigilancia de cada proceso es gratis; luego cuesta $10.000 COP por
          proceso durante 30 días.
        </p>

        <div className="mt-6 rounded-xl border border-border bg-card p-6 shadow-sm">
          <button
            onClick={() => void conGoogle()}
            disabled={cargando}
            className="mb-5 w-full rounded-md border border-input bg-background px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-accent disabled:opacity-50"
          >
            {cargando ? "Conectando con Google…" : "Continuar con Google"}
          </button>

          <form onSubmit={enviar} className="grid gap-4 sm:grid-cols-2">
            {modo === "registro" && (
              <>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Nombre completo *
                  </label>
                  <input
                    required
                    value={nombre}
                    onChange={(e) => setNombre(e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Tipo de documento
                  </label>
                  <select
                    value={tipoDocumento}
                    onChange={(e) => setTipoDocumento(e.target.value)}
                    className={input}
                  >
                    <option value="CC">Cédula de ciudadanía</option>
                    <option value="CE">Cédula de extranjería</option>
                    <option value="NIT">NIT</option>
                    <option value="PAS">Pasaporte</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Número de documento *
                  </label>
                  <input
                    required
                    value={documento}
                    onChange={(e) => setDocumento(e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Teléfono / WhatsApp *
                  </label>
                  <input
                    required
                    value={telefono}
                    onChange={(e) => setTelefono(e.target.value)}
                    placeholder="3124815124"
                    className={input}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Ciudad
                  </label>
                  <input
                    value={ciudad}
                    onChange={(e) => setCiudad(e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Tarjeta profesional (si aplica)
                  </label>
                  <input
                    value={tarjeta}
                    onChange={(e) => setTarjeta(e.target.value)}
                    className={input}
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-foreground">
                    Firma / despacho
                  </label>
                  <input
                    value={despacho}
                    onChange={(e) => setDespacho(e.target.value)}
                    className={input}
                  />
                </div>
              </>
            )}

            <div className={modo === "registro" ? "sm:col-span-2" : "sm:col-span-2"}>
              <label className="mb-1 block text-sm font-medium text-foreground">
                Correo electrónico *
              </label>
              <input
                required
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className={input}
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1 block text-sm font-medium text-foreground">
                Contraseña *
              </label>
              <input
                required
                type="password"
                minLength={8}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Mínimo 8 caracteres, evita contraseñas comunes"
                className={input}
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Usa 8+ caracteres con mayúscula, número y símbolo.
              </p>
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                disabled={cargando}
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground hover:opacity-90 disabled:opacity-50"
              >
                {cargando
                  ? "Procesando…"
                  : modo === "registro"
                    ? "Crear cuenta"
                    : "Ingresar"}
              </button>
            </div>
          </form>

          {msg && (
            <p className="mt-4 rounded-md bg-muted p-3 text-sm text-foreground">
              {msg}
            </p>
          )}

          <button
            onClick={() => setModo(modo === "registro" ? "ingreso" : "registro")}
            className="mt-4 text-sm text-muted-foreground underline-offset-2 hover:underline"
          >
            {modo === "registro"
              ? "¿Ya tienes cuenta? Ingresar"
              : "¿No tienes cuenta? Registrarme"}
          </button>
        </div>
      </div>
    </main>
  );
}
