import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useServerFn } from "@tanstack/react-start";
import { useCallback, useEffect, useRef, useState } from "react";
import {
  consultarProcesos,
  type ResultadoConsulta,
} from "@/lib/consulta.functions";
import {
  consultarPublicaciones,
  type ResultadoPublicaciones,
} from "@/lib/publicaciones.functions";
import { consultarSpoa, type ResultadoSpoa } from "@/lib/spoa.functions";
import {
  listarProcesos,
  crearProceso,
  eliminarProceso,
  marcarEstadoProceso,
  miPerfil,
  type Proceso,
  type Perfil,
} from "@/lib/casos.functions";
import { iniciarPago, confirmarPago } from "@/lib/pagos.functions";
import { supabase } from "@/integrations/supabase/client";

type Clasificacion = "civil" | "penal" | "administrativo" | "otro";
type Caso = Proceso;

const PORTALES: Record<
  Clasificacion,
  { nombre: string; url: string; color: string }
> = {
  civil: {
    nombre: "Rama Judicial",
    url: "https://consultaprocesos.ramajudicial.gov.co/Procesos/NumeroRadicacion",
    color: "badge-civil",
  },
  penal: {
    nombre: "Fiscalía General de la Nación",
    url: "https://www.fiscalia.gov.co/colombia/servicios-de-informacion-al-ciudadano/consulta-de-procesos/",
    color: "badge-penal",
  },
  administrativo: {
    nombre: "Rama Judicial",
    url: "https://consultaprocesos.ramajudicial.gov.co/Procesos/NumeroRadicacion",
    color: "badge-administrativo",
  },
  otro: {
    nombre: "Rama Judicial",
    url: "https://consultaprocesos.ramajudicial.gov.co/Procesos/NumeroRadicacion",
    color: "badge-otro",
  },
};

const WA_KEY = "consultor-whatsapp-v1";
const WA_DEFAULT = "3124815124";

const normalizarWa = (v: string) => {
  const d = v.replace(/\D/g, "");
  if (!d) return "";
  return d.startsWith("57") ? d : `57${d}`;
};

const waLink = (numero: string, mensaje: string) =>
  `https://wa.me/${normalizarWa(numero)}?text=${encodeURIComponent(mensaje)}`;

const fmt = (iso: string | null | undefined) => {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "—";
  return d.toLocaleDateString("es-CO", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
};

const diasDesde = (iso: string | null | undefined) => {
  if (!iso) return null;
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  return Math.floor((Date.now() - d.getTime()) / 86400000);
};

const vigente = (c: Caso) => new Date(c.vigente_hasta).getTime() > Date.now();

/** Muestra una notificación; en celulares usa el service worker (requisito de iPhone/Android). */
async function mostrarNotificacion(titulo: string, cuerpo: string) {
  if (typeof Notification === "undefined" || Notification.permission !== "granted") return;
  const opciones: NotificationOptions = {
    body: cuerpo,
    icon: "/icon-192.png",
    badge: "/icon-192.png",
    tag: `vigilancia-${Date.now()}`,
  };
  try {
    if ("serviceWorker" in navigator) {
      const reg = await navigator.serviceWorker.getRegistration();
      if (reg) {
        await reg.showNotification(titulo, opciones);
        return;
      }
    }
  } catch {
    /* cae al constructor clásico */
  }
  try {
    new Notification(titulo, opciones);
  } catch {
    /* sin soporte */
  }
}

const enPantallaInicio = () =>
  typeof window !== "undefined" &&
  (window.matchMedia("(display-mode: standalone)").matches ||
    (navigator as any).standalone === true);

const esIos = () =>
  typeof navigator !== "undefined" && /iPhone|iPad|iPod/i.test(navigator.userAgent);

export const Route = createFileRoute("/_authenticated/panel")({
  head: () => ({
    meta: [
      { title: "Mi panel de procesos | Vigilancia judicial" },
      {
        name: "description",
        content:
          "Panel privado para registrar procesos judiciales y recibir alertas automáticas de actuaciones en la Rama Judicial y la Fiscalía.",
      },
      { property: "og:title", content: "Mi panel de procesos" },
      {
        property: "og:description",
        content:
          "Vigilancia automática de procesos judiciales con alertas de nuevas actuaciones.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
  }),
  component: Index,
});

function Index() {
  const navigate = useNavigate();
  const [perfil, setPerfil] = useState<Perfil | null>(null);
  const [casos, setCasos] = useState<Caso[]>([]);
  const [numero, setNumero] = useState("");
  const [demandante, setDemandante] = useState("");
  const [demandado, setDemandado] = useState("");
  const [clasificacion, setClasificacion] = useState<Clasificacion>("civil");
  const [notas, setNotas] = useState("");
  const [aviso, setAviso] = useState<string | null>(null);
  const [resultados, setResultados] = useState<Record<string, ResultadoConsulta>>(
    {},
  );
  const [publicaciones, setPublicaciones] = useState<
    Record<string, ResultadoPublicaciones>
  >({});
  const [spoa, setSpoa] = useState<Record<string, ResultadoSpoa>>({});
  const [cargando, setCargando] = useState(false);
  const [ultimaSync, setUltimaSync] = useState<string | null>(null);
  const [filtro, setFiltro] = useState<Clasificacion | "todos">("todos");
  const [whatsapp, setWhatsapp] = useState(WA_DEFAULT);
  const [alertas, setAlertas] = useState<
    { id: string; titulo: string; detalle: string; fecha: string | null }[]
  >([]);
  const [permisoNotif, setPermisoNotif] = useState<string>("default");
  const [pendientePago, setPendientePago] = useState<string | null>(null);
  const consultar = useServerFn(consultarProcesos);
  const consultarPubs = useServerFn(consultarPublicaciones);
  const consultarFiscalia = useServerFn(consultarSpoa);
  const cargarPerfil = useServerFn(miPerfil);
  const cargarProcesos = useServerFn(listarProcesos);
  const nuevoProceso = useServerFn(crearProceso);
  const borrarProceso = useServerFn(eliminarProceso);
  const guardarEstado = useServerFn(marcarEstadoProceso);
  const pagar = useServerFn(iniciarPago);
  const verificarPago = useServerFn(confirmarPago);
  const autoHecho = useRef(false);

  useEffect(() => {
    try {
      const wa = window.localStorage.getItem(WA_KEY);
      if (wa) setWhatsapp(wa);
    } catch {
      /* ignore */
    }
    try {
      const ref = window.localStorage.getItem("wompi-ref");
      if (ref) setPendientePago(ref);
    } catch {
      /* ignore */
    }
    if (typeof Notification !== "undefined")
      setPermisoNotif(Notification.permission);
    else setPermisoNotif("unsupported");
    if ("serviceWorker" in navigator) {
      navigator.serviceWorker.register("/sw.js").catch(() => {});
    }
    void (async () => {
      const [p, lista] = await Promise.all([cargarPerfil(), cargarProcesos()]);
      setPerfil(p);
      setCasos(lista);
    })();
  }, [cargarPerfil, cargarProcesos]);

  // Confirma el pago cuando el usuario vuelve de la pasarela.
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const referencia = params.get("pago");
    const transaccionId = params.get("id") ?? "";
    if (!referencia) return;
    void (async () => {
      const r = await verificarPago({ data: { referencia, transaccionId } });
      setAviso(
        r.estado === "APROBADO"
          ? "Pago aprobado. La vigilancia del proceso quedó activa por 30 días."
          : `Estado del pago: ${r.estado}. Si acabas de pagar, vuelve a intentar en un momento.`,
      );
      setCasos(await cargarProcesos());
      window.history.replaceState({}, "", "/panel");
    })();
  }, [verificarPago, cargarProcesos]);

  const guardarWhatsapp = (v: string) => {
    setWhatsapp(v);
    window.localStorage.setItem(WA_KEY, v);
  };

  const cerrarSesion = async () => {
    await supabase.auth.signOut();
    void navigate({ to: "/auth", replace: true });
  };

  const comprar = async (caso: Caso) => {
    setAviso("Preparando el pago con Wompi…");
    let r: Awaited<ReturnType<typeof iniciarPago>>;
    try {
      r = await pagar({
        data: { procesoId: caso.id, origen: window.location.origin },
      });
    } catch (err) {
      setAviso(
        `No se pudo iniciar el pago: ${
          err instanceof Error ? err.message : "error desconocido del servidor"
        }`,
      );
      return;
    }
    if (!r.configurado) {
      setAviso(r.mensaje);
      return;
    }
    if (r.esLinkDePago) {
      setAviso(
        "Se abre el link de pago de Wompi. Después de pagar, el sistema lo reflejará en cuanto Wompi envíe la confirmación; si no, escríbele al administrador para activar la vigencia.",
      );
    }
    window.localStorage.setItem("wompi-ref", r.referencia);
    setPendientePago(r.referencia);
    window.location.href = r.url;
  };

  /** Verifica el pago iniciado (el retorno con redirect-url se omite en local
   *  por el bloqueo de CloudFront; la verificación se hace por referencia). */
  const verificarPagoPendiente = async () => {
    if (!pendientePago) return;
    let r: { estado: string };
    try {
      r = await verificarPago({
        data: { referencia: pendientePago },
      });
    } catch {
      setAviso(
        "No se pudo verificar el pago ahora. Reintenta; si persiste, verifica la configuración de Wompi/servidor.",
      );
      return;
    }
    setCasos(await cargarProcesos());
    if (r.estado === "APROBADO") {
      window.localStorage.removeItem("wompi-ref");
      setPendientePago(null);
      setAviso(
        "Pago aprobado. La vigilancia del proceso quedó activa por 30 días.",
      );
      return;
    }
    setAviso(
      `Estado del pago: ${r.estado}. Si acabas de pagar, espera unos segundos y vuelve a verificar.`,
    );
  };

  const [avisoNotif, setAvisoNotif] = useState<string | null>(null);
  const pedirPermiso = async () => {
    if (typeof Notification === "undefined") {
      setAvisoNotif(
        esIos() && !enPantallaInicio()
          ? "En iPhone/iPad primero agrega la app a la pantalla de inicio (Compartir → «Agregar a pantalla de inicio»), ábrela desde ahí y luego pulsa «Activar notificaciones»."
          : "Este navegador no admite notificaciones. En Android/PC usa Chrome, Edge o Firefox.",
      );
      return;
    }
    try {
      const p = await Notification.requestPermission();
      setPermisoNotif(p);
      if (p === "granted") {
        setAvisoNotif("Notificaciones activadas. Te enviamos una de prueba.");
        void mostrarNotificacion(
          "Vigilancia judicial activa",
          "Recibirás un aviso aquí cuando un proceso tenga una actuación nueva.",
        );
      } else if (p === "denied") {
        setAvisoNotif(
          "El navegador bloqueó las notificaciones. Haz clic en el candado junto a la dirección web, permite «Notificaciones» y vuelve a intentar.",
        );
      } else {
        setAvisoNotif(
          "No se pudo abrir la ventana de permiso. Si estás dentro del editor, abre la aplicación en su propia pestaña (botón «Abrir en nueva pestaña» o la dirección publicada) y actívalas allí.",
        );
      }
    } catch {
      setAvisoNotif(
        "No se pudo pedir el permiso desde esta vista. Abre la aplicación en una pestaña propia y vuelve a intentar.",
      );
    }
  };

  const notificar = useCallback(
    (nuevas: { id: string; titulo: string; detalle: string; fecha: string | null }[]) => {
      if (nuevas.length === 0) return;
      setAlertas((prev) => {
        const ids = new Set(prev.map((a) => a.id));
        return [...nuevas.filter((n) => !ids.has(n.id)), ...prev].slice(0, 20);
      });
      void mostrarNotificacion(
        nuevas.length === 1
          ? "⚖️ Nueva actuación judicial"
          : `⚖️ ${nuevas.length} procesos con novedades`,
        nuevas
          .map((n) => `${n.titulo} — ${fmt(n.fecha)}: ${n.detalle}`)
          .join(" · ")
          .slice(0, 240),
      );
    },
    [],
  );

  const sincronizar = useCallback(
    async (todos: Caso[]) => {
      const lista = todos.filter(vigente);
      if (lista.length === 0) return;
      setCargando(true);
      try {
        const [consultaRes, pubsRes] = await Promise.allSettled([
          consultar({
            data: {
              numeros: lista.map((c) => ({
                numero: c.numero,
                demandante: c.demandante,
                demandado: c.demandado,
              })),
            },
          }),
          consultarPubs({
            data: {
              terminos: lista.map((c) => ({
                radicado: c.numero,
                demandante: c.demandante,
                demandado: c.demandado,
              })),
            },
          }),
        ]);
        const res =
          consultaRes.status === "fulfilled" ? consultaRes.value.resultados : [];
        const pubs = pubsRes.status === "fulfilled" ? pubsRes.value.resultados : [];

        const mapa: Record<string, ResultadoConsulta> = {};
        const mapaPubs: Record<string, ResultadoPublicaciones> = {};
        const nuevas: {
          id: string;
          titulo: string;
          detalle: string;
          fecha: string | null;
        }[] = [];
        lista.forEach((caso, i) => {
          const r = res[i];
          const p = pubs[i];
          if (r) mapa[caso.id] = r;
          if (p) mapaPubs[caso.id] = p;
          // Fecha más reciente entre Consulta de Procesos y Publicaciones.
          const fechas = [
            r?.encontrado ? r.fechaUltimaActuacion : null,
            p?.coincidencias ? p.ultimaFecha : null,
          ].filter((f): f is string => !!f);
          const ultima = fechas.sort((a, b) => b.localeCompare(a))[0] ?? null;
          if (ultima && caso.ultima_vista !== ultima) {
            const detalle =
              ultima === r?.fechaUltimaActuacion
                ? (r?.actuaciones[0]?.actuacion ?? r?.despacho ?? "Nueva actuación registrada")
                : `Publicación: ${p?.publicaciones[0]?.titulo ?? "nuevo estado publicado"}`;
            nuevas.push({
              id: `${caso.id}-${ultima}`,
              titulo: `${caso.numero || caso.demandante || caso.demandado || "Caso"}`,
              detalle,
              fecha: ultima,
            });
          }
          void guardarEstado({
            data: { id: caso.id, ultima_actuacion: ultima },
          });
        });
        setResultados((prev) => ({ ...prev, ...mapa }));
        setPublicaciones((prev) => ({ ...prev, ...mapaPubs }));
        setUltimaSync(new Date().toISOString());
        notificar(nuevas);

        const penales = lista.filter((c) => c.clasificacion === "penal");
        if (penales.length > 0) {
          const { resultados: sp } = await consultarFiscalia({
            data: {
              terminos: penales.map(
                (c) => c.numero.trim() || c.demandado || c.demandante || "",
              ),
            },
          });
          const mapaSpoa: Record<string, ResultadoSpoa> = {};
          sp.forEach((s, i) => {
            const caso = penales[i];
            if (caso) mapaSpoa[caso.id] = s;
          });
          setSpoa((prev) => ({ ...prev, ...mapaSpoa }));
        }
      } catch {
        /* ignore */
      } finally {
        setCargando(false);
      }
    },
    [consultar, consultarPubs, consultarFiscalia, notificar, guardarEstado],
  );

  useEffect(() => {
    if (autoHecho.current || casos.length === 0) return;
    autoHecho.current = true;
    void sincronizar(casos);
  }, [casos, sincronizar]);

  // Vigilancia automática: revisa cada 15 minutos si hay actuaciones nuevas.
  useEffect(() => {
    if (casos.length === 0) return;
    const id = window.setInterval(() => void sincronizar(casos), 15 * 60 * 1000);
    return () => window.clearInterval(id);
  }, [casos, sincronizar]);

  const agregarCaso = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!numero.trim() && !demandante.trim() && !demandado.trim()) return;
    const nuevo = await nuevoProceso({
      data: {
        numero: numero.trim(),
        demandante: demandante.trim(),
        demandado: demandado.trim(),
        clasificacion,
        notas: notas.trim(),
      },
    });
    const caso = nuevo.proceso;
    setCasos((prev) => [caso, ...prev]);
    setNumero("");
    setDemandante("");
    setDemandado("");
    setNotas("");
    setClasificacion("civil");
    setAviso(nuevo.mensaje);
    await sincronizar([caso]);
  };

  const eliminarCaso = async (id: string) => {
    await borrarProceso({ data: { id } });
    setCasos((prev) => prev.filter((c) => c.id !== id));
  };

  /** Fecha más reciente conocida del caso (consulta de procesos o publicaciones). */
  const ultimaFechaCaso = (caso: Caso): string | null => {
    const r = resultados[caso.id];
    const p = publicaciones[caso.id];
    const fechas = [
      r?.encontrado ? r.fechaUltimaActuacion : null,
      p?.coincidencias ? p.ultimaFecha : null,
    ].filter((f): f is string => !!f);
    return fechas.sort((a, b) => b.localeCompare(a))[0] ?? null;
  };

  const marcarVisto = (caso: Caso) => {
    const vista = ultimaFechaCaso(caso);
    setCasos((prev) =>
      prev.map((c) => (c.id === caso.id ? { ...c, ultima_vista: vista } : c)),
    );
    void guardarEstado({ data: { id: caso.id, ultima_vista: vista } });
  };

  const encontradoEnPortal = (caso: Caso) =>
    !!resultados[caso.id]?.encontrado ||
    (publicaciones[caso.id]?.coincidencias ?? 0) > 0;

  const esNuevo = (caso: Caso) => {
    const ultima = ultimaFechaCaso(caso);
    if (!ultima) return false;
    return caso.ultima_vista !== ultima;
  };

  const visibles =
    filtro === "todos" ? casos : casos.filter((c) => c.clasificacion === filtro);

  const total = casos.length;
  const encontrados = casos.filter(encontradoEnPortal).length;
  const novedades = casos.filter(esNuevo).length;
  const sinDatos = casos.filter(
    (c) => (resultados[c.id] || publicaciones[c.id]) && !encontradoEnPortal(c),
  ).length;


  return (
    <main className="min-h-screen bg-background px-4 py-10">
      <div className="mx-auto max-w-5xl">
        <nav className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card px-4 py-3 text-sm">
          <span className="text-muted-foreground">
            {perfil?.nombre_completo || perfil?.email || "Mi cuenta"} ·{" "}
            <span className="font-semibold text-foreground">
              Plan {perfil?.plan === "pago" ? "pago" : "gratis"}
            </span>
          </span>
          <div className="flex flex-wrap gap-2">
            <Link
              to="/cuenta"
              className="rounded-md border border-input px-3 py-1.5 font-medium text-foreground hover:bg-accent"
            >
              Mis datos
            </Link>
            {perfil?.esAdmin && (
              <Link
                to="/admin"
                className="rounded-md border border-input px-3 py-1.5 font-medium text-foreground hover:bg-accent"
              >
                Administración
              </Link>
            )}
            <button
              onClick={() => void cerrarSesion()}
              className="rounded-md border border-input px-3 py-1.5 font-medium text-foreground hover:bg-accent"
            >
              Cerrar sesión
            </button>
          </div>
        </nav>
        {aviso && (
          <p className="mb-6 rounded-xl border border-primary/40 bg-primary/10 p-3 text-sm text-foreground">
            {aviso}
          </p>
        )}

        {pendientePago && (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 text-sm">
            <span className="text-muted-foreground">
              Hay un pago de Wompi iniciado (ref.{" "}
              <span className="font-mono">{pendientePago}</span>).
            </span>
            <button
              onClick={() => void verificarPagoPendiente()}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground hover:opacity-90"
            >
              Ya pagué — verificar pago
            </button>
          </div>
        )}

        {/* Estado de monetización (compacto, siempre visible) */}
        {perfil?.plan === "pago" ? (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-600/40 bg-emerald-600/10 p-3 text-sm">
            <span className="font-semibold text-foreground">
              🟢 Plan PAGO activo — vigilancia ilimitada de procesos (30 días por
              proceso).
            </span>
          </div>
        ) : (
          <div className="mb-6 flex flex-wrap items-center justify-between gap-3 rounded-xl border border-amber-600/40 bg-amber-600/10 p-3 text-sm">
            <span className="font-semibold text-foreground">
              🟡 Plan GRATIS: <strong>1 proceso gratis por 1 día</strong> ·
              usados {Math.min(casos.length, 1)}/1
              {casos.length > 0 && (
                <span className="block font-normal text-muted-foreground">
                  Para agregar otro proceso o renovar el vigente: $10.000 COP por
                  30 días vía Wompi.
                </span>
              )}
            </span>
          </div>
        )}

        <header className="mb-8 flex flex-wrap items-end justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight text-foreground">
              Dashboard de Casos Judiciales
            </h1>
            <p className="mt-2 max-w-2xl text-sm text-muted-foreground">
              Al cargar un caso se consulta automáticamente el sistema de la
              Rama Judicial y se muestran las últimas actuaciones registradas.
              Para casos penales en etapa de investigación, se enlaza además el
              portal de la Fiscalía.
            </p>
          </div>
          <div className="text-right">
            <button
              onClick={() => void sincronizar(casos)}
              disabled={cargando || casos.length === 0}
              className="rounded-md bg-primary px-4 py-2 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-50"
            >
              {cargando ? "Consultando…" : "Actualizar todo"}
            </button>
            <p className="mt-1 text-xs text-muted-foreground">
              Última consulta:{" "}
              {ultimaSync
                ? new Date(ultimaSync).toLocaleTimeString("es-CO")
                : "—"}
            </p>
          </div>
        </header>

        <section className="mb-8 rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-card-foreground">
                Alarma de actualizaciones
              </h2>
              <p className="mt-1 text-xs text-muted-foreground">
                Revisa los procesos cada 15 minutos. Si hay una actuación nueva
                te avisa aquí, con notificación del navegador, y prepara el
                mensaje de WhatsApp listo para enviar.
              </p>
            </div>
            <div className="flex flex-wrap items-end gap-2">
              <label className="text-xs text-muted-foreground">
                WhatsApp de alerta
                <input
                  value={whatsapp}
                  onChange={(e) => guardarWhatsapp(e.target.value)}
                  placeholder="3124815124"
                  className="mt-1 block w-40 rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground"
                />
              </label>
              {permisoNotif === "granted" ? (
                <span className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-muted-foreground">
                  Notificaciones activas ✓
                </span>
              ) : (
                <button
                  onClick={() => void pedirPermiso()}
                  className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                >
                  {permisoNotif === "denied"
                    ? "Notificaciones bloqueadas"
                    : "Activar notificaciones"}
                </button>
              )}
            </div>
          </div>
          {avisoNotif && (
            <p className="mt-3 rounded-md border border-border bg-muted/50 p-2 text-xs text-foreground">
              {avisoNotif}
            </p>
          )}
          <details className="mt-3 text-xs text-muted-foreground">
            <summary className="cursor-pointer font-medium text-foreground">
              Cómo recibir los avisos en el celular
            </summary>
            <ol className="mt-2 list-decimal space-y-1 pl-5">
              <li>
                Abre esta dirección en el navegador del celular (Chrome en
                Android, Safari en iPhone) e inicia sesión.
              </li>
              <li>
                Agrégala a la pantalla de inicio: en Android, menú ⋮ →
                «Instalar app»; en iPhone, botón Compartir → «Agregar a pantalla
                de inicio».
              </li>
              <li>
                Abre la app desde el ícono nuevo y pulsa «Activar
                notificaciones». Llegará una de prueba de inmediato.
              </li>
              <li>
                Mientras la app esté abierta o en segundo plano, revisa cada 15
                minutos y te avisa con notificación, además del botón para
                reenviarla por WhatsApp.
              </li>
            </ol>
          </details>

          {alertas.length > 0 ? (
            <div className="mt-4 space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <p className="text-sm font-semibold text-foreground">
                  {alertas.length} alerta(s) de actualización
                </p>
                <div className="flex gap-2">
                  <a
                    href={waLink(
                      whatsapp,
                      `⚖️ Alerta de procesos judiciales\n\n${alertas
                        .map(
                          (a) =>
                            `• ${a.titulo} — ${fmt(a.fecha)}\n  ${a.detalle}`,
                        )
                        .join("\n")}`,
                    )}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-md bg-primary px-3 py-2 text-xs font-semibold text-primary-foreground hover:opacity-90"
                  >
                    Enviar todo por WhatsApp
                  </a>
                  <button
                    onClick={() => setAlertas([])}
                    className="rounded-md border border-border px-3 py-2 text-xs font-semibold text-foreground hover:bg-muted"
                  >
                    Limpiar
                  </button>
                </div>
              </div>
              <ul className="space-y-2">
                {alertas.map((a) => (
                  <li
                    key={a.id}
                    className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border bg-background p-3"
                  >
                    <div className="min-w-0">
                      <p className="truncate text-sm font-medium text-foreground">
                        {a.titulo}
                      </p>
                      <p className="truncate text-xs text-muted-foreground">
                        {fmt(a.fecha)} · {a.detalle}
                      </p>
                    </div>
                    <a
                      href={waLink(
                        whatsapp,
                        `⚖️ Actualización en el proceso ${a.titulo}\nFecha: ${fmt(a.fecha)}\nActuación: ${a.detalle}`,
                      )}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                    >
                      WhatsApp
                    </a>
                  </li>
                ))}
              </ul>
            </div>
          ) : (
            <p className="mt-3 text-xs text-muted-foreground">
              Sin alertas pendientes.
            </p>
          )}
        </section>


        <section className="mb-8 grid gap-4 sm:grid-cols-4">
          {[
            { label: "Casos registrados", valor: total },
            { label: "Encontrados en el portal", valor: encontrados },
            { label: "Con novedades", valor: novedades },
            { label: "Sin resultados", valor: sinDatos },
          ].map((k) => (
            <div
              key={k.label}
              className="rounded-xl border border-border bg-card p-4 shadow-sm"
            >
              <p className="text-2xl font-bold text-card-foreground">
                {k.valor}
              </p>
              <p className="mt-1 text-xs text-muted-foreground">{k.label}</p>
            </div>
          ))}
        </section>

        <section className="rounded-xl border border-border bg-card p-6 shadow-sm">
          <h2 className="mb-4 text-lg font-semibold text-card-foreground">
            Registrar un caso
          </h2>
          <form onSubmit={agregarCaso} className="grid gap-4 sm:grid-cols-2">
            <div className="sm:col-span-2">
              <label
                htmlFor="numero"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Número de radicado (23 dígitos) o nombre de la parte
              </label>
              <input
                id="numero"
                type="text"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="Ej: 05001310300520190037200"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Si no tienes el radicado completo, escribe el nombre del
                demandante o demandado y la consulta se hará por nombre.
              </p>

            </div>

            <div>
              <label
                htmlFor="demandante"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Demandante / Denunciante
              </label>
              <input
                id="demandante"
                type="text"
                value={demandante}
                onChange={(e) => setDemandante(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div>
              <label
                htmlFor="demandado"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Demandado / Procesado
              </label>
              <input
                id="demandado"
                type="text"
                value={demandado}
                onChange={(e) => setDemandado(e.target.value)}
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div>
              <label
                htmlFor="clasificacion"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Clasificación *
              </label>
              <select
                id="clasificacion"
                value={clasificacion}
                onChange={(e) =>
                  setClasificacion(e.target.value as Clasificacion)
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              >
                <option value="civil">Civil</option>
                <option value="penal">Penal</option>
                <option value="administrativo">Administrativo</option>
                <option value="otro">Otro</option>
              </select>
            </div>

            <div>
              <label
                htmlFor="notas"
                className="mb-1 block text-sm font-medium text-foreground"
              >
                Notas (opcional)
              </label>
              <input
                id="notas"
                type="text"
                value={notas}
                onChange={(e) => setNotas(e.target.value)}
                placeholder="Ej: audiencia pendiente"
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-ring focus:ring-2 focus:ring-ring/30"
              />
            </div>

            <div className="sm:col-span-2">
              <button
                type="submit"
                className="w-full rounded-md bg-primary px-4 py-2.5 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90"
              >
                Agregar y consultar automáticamente
              </button>
            </div>
          </form>
        </section>

        <section className="mt-8">
          <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
            <h2 className="text-lg font-semibold text-foreground">
              Casos y estado actual ({visibles.length})
            </h2>
            <div className="flex flex-wrap gap-2">
              {(
                ["todos", "civil", "penal", "administrativo", "otro"] as const
              ).map((f) => (
                <button
                  key={f}
                  onClick={() => setFiltro(f)}
                  className={`rounded-full border px-3 py-1 text-xs font-medium capitalize transition-colors ${
                    filtro === f
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-input bg-background text-muted-foreground hover:bg-accent"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {visibles.length === 0 ? (
            <p className="rounded-xl border border-dashed border-border bg-muted/40 p-8 text-center text-sm text-muted-foreground">
              No hay casos para mostrar. Registra uno arriba y la consulta se
              hará automáticamente.
            </p>
          ) : (
            <ul className="space-y-4">
              {visibles.map((caso) => {
                const portal =
                  PORTALES[caso.clasificacion as Clasificacion] ?? PORTALES.otro;
                const r = resultados[caso.id];
                const dias = diasDesde(r?.fechaUltimaActuacion);
                return (
                  <li
                    key={caso.id}
                    className="rounded-xl border border-border bg-card p-5 shadow-sm"
                  >
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div className="min-w-0">
                        <div className="flex flex-wrap items-center gap-2">
                          <span
                            className={`inline-block rounded-full px-3 py-0.5 text-xs font-semibold uppercase tracking-wide ${portal.color}`}
                          >
                            {caso.clasificacion}
                          </span>
                          {esNuevo(caso) && (
                            <span className="rounded-full bg-primary px-3 py-0.5 text-xs font-semibold text-primary-foreground">
                              Nueva actualización
                            </span>
                          )}
                          {r && !r.encontrado && !encontradoEnPortal(caso) && (
                            <span className="rounded-full border border-border px-3 py-0.5 text-xs text-muted-foreground">
                              Sin resultados
                            </span>
                          )}
                          {r && !r.encontrado && encontradoEnPortal(caso) && (
                            <span className="rounded-full border border-border px-3 py-0.5 text-xs text-muted-foreground">
                              Encontrado en publicaciones procesales
                            </span>
                          )}
                        </div>
                        <p className="mt-2 font-mono text-sm font-semibold text-card-foreground">
                          {caso.numero}
                        </p>
                        {(caso.demandante || caso.demandado) && (
                          <p className="mt-1 text-sm text-muted-foreground">
                            {caso.demandante}
                            {caso.demandante && caso.demandado && " vs. "}
                            {caso.demandado}
                          </p>
                        )}
                        {caso.notas && (
                          <p className="mt-1 text-sm italic text-muted-foreground">
                            {caso.notas}
                          </p>
                        )}
                      </div>
                      <button
                        onClick={() => void eliminarCaso(caso.id)}
                        className="text-xs text-muted-foreground underline-offset-2 hover:text-destructive hover:underline"
                      >
                        Eliminar
                      </button>
                    </div>

                    <div className="mt-3 rounded-md border border-border bg-muted/40 p-3 text-xs">
                      {vigente(caso) ? (
                        <span className="text-muted-foreground">
                          Vigilancia activa hasta {fmt(caso.vigente_hasta)}.
                        </span>
                      ) : (
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span className="font-medium text-foreground">
                            Vigilancia vencida. Actívala 30 días por $10.000 COP.
                          </span>
                          <button
                            onClick={() => void comprar(caso)}
                            className="rounded-md bg-primary px-3 py-1.5 text-xs font-semibold text-primary-foreground hover:opacity-90"
                          >
                            Pagar con Wompi
                          </button>
                        </div>
                      )}
                    </div>


                    {!r && (
                      <p className="mt-4 text-sm text-muted-foreground">
                        {cargando
                          ? "Consultando el portal judicial…"
                          : "Aún sin consultar."}
                      </p>
                    )}

                    {r?.error && (
                      <p className="mt-4 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                        {r.error}
                      </p>
                    )}

                    {r?.encontrado && (
                      <div className="mt-4 space-y-4">
                        <dl className="grid gap-3 text-sm sm:grid-cols-2">
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Despacho
                            </dt>
                            <dd className="text-foreground">
                              {r.despacho ?? "—"}
                              {r.departamento ? ` (${r.departamento})` : ""}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Tipo / clase de proceso
                            </dt>
                            <dd className="text-foreground">
                              {[r.tipoProceso, r.claseProceso]
                                .filter(Boolean)
                                .join(" · ") || "—"}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Última actuación
                            </dt>
                            <dd className="font-medium text-foreground">
                              {fmt(r.fechaUltimaActuacion)}
                              {dias !== null && (
                                <span className="text-muted-foreground">
                                  {" "}
                                  · hace {dias} días
                                </span>
                              )}
                            </dd>
                          </div>
                          <div>
                            <dt className="text-xs text-muted-foreground">
                              Ubicación del expediente
                            </dt>
                            <dd className="text-foreground">
                              {r.ubicacion ?? "—"}
                            </dd>
                          </div>
                          {r.sujetos && (
                            <div className="sm:col-span-2">
                              <dt className="text-xs text-muted-foreground">
                                Sujetos procesales
                              </dt>
                              <dd className="text-foreground">{r.sujetos}</dd>
                            </div>
                          )}
                        </dl>

                        {r.actuaciones.length > 0 && (
                          <div>
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Últimas actuaciones
                            </p>
                            <ol className="space-y-2 border-l border-border pl-4">
                              {r.actuaciones.map((a, i) => (
                                <li key={i} className="text-sm">
                                  <span className="font-medium text-foreground">
                                    {fmt(a.fechaActuacion)} — {a.actuacion}
                                  </span>
                                  {a.anotacion && (
                                    <span className="block text-muted-foreground">
                                      {a.anotacion}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ol>
                          </div>
                        )}
                      </div>
                    )}

                    {(() => {
                      const pubs = publicaciones[caso.id];
                      if (!pubs)
                        return cargando ? (
                          <p className="mt-4 text-sm text-muted-foreground">
                            Buscando publicaciones procesales…
                          </p>
                        ) : null;
                      if (pubs.error)
                        return (
                          <p className="mt-4 rounded-md bg-muted/60 p-3 text-sm text-muted-foreground">
                            {pubs.error}
                          </p>
                        );
                      return (
                        <div className="mt-4">
                          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                            Publicaciones procesales
                            {pubs.coincidencias > 0
                              ? ` · ${pubs.coincidencias} coinciden con este caso`
                              : ` · sin coincidencias exactas (${pubs.total} resultados generales)`}
                          </p>
                          {pubs.publicaciones.length === 0 ? (
                            <p className="text-sm text-muted-foreground">
                              Sin publicaciones para «{pubs.termino}».
                            </p>
                          ) : (
                            <ol className="space-y-2 border-l border-border pl-4">
                              {pubs.publicaciones.slice(0, 5).map((p, i) => (
                                <li key={i} className="text-sm">
                                  <a
                                    href={p.url}
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="font-medium text-primary underline-offset-2 hover:underline"
                                  >
                                    {p.titulo}
                                  </a>
                                  <span className="block text-muted-foreground">
                                    {fmt(p.fecha) !== "—"
                                      ? fmt(p.fecha)
                                      : (p.fechaTexto ?? "—")}
                                    {p.autor ? ` · ${p.autor}` : ""}
                                  </span>
                                  {p.resumen && (
                                    <span className="block text-muted-foreground">
                                      {p.resumen}
                                    </span>
                                  )}
                                </li>
                              ))}
                            </ol>
                          )}
                        </div>
                      );
                    })()}

                    {caso.clasificacion === "penal" &&
                      (() => {
                        const s = spoa[caso.id];
                        if (!s)
                          return cargando ? (
                            <p className="mt-4 text-sm text-muted-foreground">
                              Consultando el SPOA de la Fiscalía…
                            </p>
                          ) : null;
                        return (
                          <div className="mt-4 rounded-lg border border-border bg-muted/40 p-3">
                            <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                              Fiscalía · SPOA
                            </p>
                            {s.registros.length > 0 ? (
                              <ol className="space-y-2 border-l border-border pl-4">
                                {s.registros.map((reg, i) => (
                                  <li key={i} className="text-sm">
                                    <span className="font-medium text-foreground">
                                      {reg.nunc ?? caso.numero}
                                      {reg.delito ? ` — ${reg.delito}` : ""}
                                    </span>
                                    <span className="block text-muted-foreground">
                                      {[
                                        reg.etapa,
                                        reg.estado,
                                        reg.seccional,
                                        fmt(reg.fecha) !== "—"
                                          ? fmt(reg.fecha)
                                          : reg.fecha,
                                      ]
                                        .filter(Boolean)
                                        .join(" · ") || "Sin detalle"}
                                    </span>
                                  </li>
                                ))}
                              </ol>
                            ) : (
                              <p className="text-sm text-muted-foreground">
                                {s.mensaje}
                              </p>
                            )}
                            <div className="mt-3 flex flex-wrap gap-2">
                              <button
                                onClick={() =>
                                  void navigator.clipboard.writeText(
                                    caso.numero,
                                  )
                                }
                                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                              >
                                Copiar NUNC
                              </button>
                              <a
                                href={s.enlace}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="rounded-md border border-input bg-background px-3 py-1.5 text-xs font-medium text-foreground hover:bg-accent"
                              >
                                Abrir consulta SPOA ↗
                              </a>
                            </div>
                          </div>
                        );
                      })()}

                    <div className="mt-4 flex flex-wrap gap-2">

                      <button
                        onClick={() => void sincronizar([caso])}
                        disabled={cargando}
                        className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent disabled:opacity-50"
                      >
                        Consultar ahora
                      </button>
                      {esNuevo(caso) && (
                        <button
                          onClick={() => marcarVisto(caso)}
                          className="rounded-md border border-input bg-background px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-accent"
                        >
                          Marcar como visto
                        </button>
                      )}
                      <a
                        href={portal.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="rounded-md bg-primary px-3 py-2 text-sm font-medium text-primary-foreground transition-opacity hover:opacity-90"
                      >
                        Abrir {portal.nombre} ↗
                      </a>
                    </div>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <footer className="mt-10 border-t border-border pt-4 text-xs text-muted-foreground">
          Los casos se guardan en tu cuenta. La información se obtiene en
          tiempo real de la Rama Judicial (consulta de procesos y publicaciones
          procesales). Para casos penales se intenta además el SPOA de la
          Fiscalía con el NUNC de 21 dígitos; cuando ese servicio exige captcha
          o no responde, se muestra el enlace directo al portal.

        </footer>
      </div>
    </main>
  );
}
