import Link from "next/link";
import { AREAS } from "@/lib/areas";
import { MINUTAS } from "@/lib/minutas";
import { PLANES } from "@/lib/planes";
import { Chispa, Documento, Escudo, Flecha, Grafica, Radar, Reloj } from "@/components/iconos";

const SERVICIOS = [
  { icono: Chispa, t: "Orientación con IA", d: "Cuenta tu caso en tus palabras: identificamos el área, la urgencia y los siguientes pasos en minutos. Gratis.", href: "/orientacion", cta: "Consultar ahora" },
  { icono: Documento, t: "Minutas y formatos", d: `${MINUTAS.length} modelos listos: tutelas, derechos de petición, contratos, pagarés, letras y poderes. Descarga en Word o PDF.`, href: "/minutas", cta: "Ver catálogo" },
  { icono: Radar, t: "Vigilancia de procesos", d: "Para abogados: consultamos la Rama Judicial cada día y te avisamos de cada actuación nueva y término por vencer.", href: "/planes", cta: "Ver planes" },
];

const PASOS = [
  { t: "Cuéntanos tu caso", d: "El asistente entiende tu necesidad y la clasifica por área y urgencia." },
  { t: "Recibe un concepto", d: "Un abogado inscrito revisa y firma un concepto preliminar sobre tu caso." },
  { t: "Elige tu abogado", d: "Te sugerimos especialistas verificados según costo, urgencia y calificación." },
];

const CIFRAS = [
  [String(AREAS.length), "áreas del derecho"],
  [String(MINUTAS.length), "minutas jurídicas"],
  ["24/7", "orientación con IA"],
  ["Diaria", "consulta a la Rama Judicial"],
];

const ACTUACIONES = [
  { f: "Hoy", a: "Auto que admite demanda", nueva: true },
  { f: "Ayer", a: "Fijación en estado", nueva: true },
  { f: "14 oct", a: "Traslado de excepciones", nueva: false },
];

export default function Inicio() {
  return (
    <div className="-mt-10 space-y-24">
      {/* Portada */}
      <section className="ancho-total fondo-hero relative overflow-hidden text-white">
        <div className="rejilla absolute inset-0" />
        <div className="relative mx-auto grid max-w-6xl items-center gap-12 px-4 py-20 lg:grid-cols-[1.15fr_1fr] lg:py-28">
          <div className="space-y-7">
            <p className="aparecer inline-flex items-center gap-2 rounded-full border border-oro-400/30 bg-oro-400/10 px-3 py-1 text-xs font-medium text-oro-300">
              <span className="pulso size-1.5 rounded-full bg-oro-400" /> Plataforma jurídica de DOMINET para Colombia
            </p>
            <h1 className="aparecer retraso-1 text-4xl leading-[1.1] sm:text-5xl lg:text-6xl">
              El derecho, <span className="texto-oro italic">resuelto</span> con tecnología y abogados de verdad.
            </h1>
            <p className="aparecer retraso-2 max-w-xl text-lg text-slate-300">
              Orientación inmediata con inteligencia artificial, abogados verificados, minutas listas para usar y vigilancia automática de procesos judiciales.
            </p>
            <div className="aparecer retraso-3 flex flex-wrap gap-3">
              <Link href="/orientacion" className="group inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-oro-400 to-oro-500 px-6 py-3.5 font-semibold text-tinta shadow-xl shadow-oro-500/25 transition hover:brightness-110">
                Tengo un problema legal <Flecha className="size-4 transition group-hover:translate-x-1" />
              </Link>
              <Link href="/planes" className="rounded-xl border border-white/20 bg-white/5 px-6 py-3.5 font-semibold backdrop-blur transition hover:bg-white/10">
                Soy abogado
              </Link>
            </div>
            <div className="flex flex-wrap gap-x-6 gap-y-2 pt-2 text-sm text-slate-400">
              <span className="flex items-center gap-1.5"><Escudo className="size-4 text-oro-400" /> Tarjeta profesional verificada</span>
              <span className="flex items-center gap-1.5"><Reloj className="size-4 text-oro-400" /> Respuesta en minutos</span>
            </div>
          </div>

          {/* Tarjeta de muestra del seguimiento de procesos */}
          <div className="aparecer retraso-2 relative">
            <div className="absolute -inset-6 rounded-[2rem] bg-oro-500/10 blur-3xl" />
            <div className="relative rounded-2xl border border-white/10 bg-white/[0.06] p-6 shadow-2xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-widest text-oro-300">Vigilancia de procesos</p>
                <span className="flex items-center gap-1.5 text-xs text-emerald-300"><span className="pulso size-2 rounded-full bg-emerald-400" /> En línea</span>
              </div>
              <p className="mt-4 font-mono text-sm text-slate-300">11001 31 03 012 2026 00145 00</p>
              <p className="text-sm text-slate-400">Juzgado 12 Civil del Circuito · Bogotá</p>
              <ul className="mt-5 space-y-3">
                {ACTUACIONES.map((x) => (
                  <li key={x.a} className="flex items-center justify-between rounded-xl bg-white/5 px-4 py-3 text-sm">
                    <span><span className="block text-white">{x.a}</span><span className="text-xs text-slate-400">{x.f}</span></span>
                    {x.nueva && <span className="rounded-full bg-oro-400/15 px-2.5 py-0.5 text-xs font-semibold text-oro-300">Nueva</span>}
                  </li>
                ))}
              </ul>
              <div className="mt-5 flex items-center gap-3 rounded-xl border border-red-400/20 bg-red-500/10 px-4 py-3 text-sm text-red-200">
                <Reloj className="size-5 shrink-0" /> Término de traslado vence en 3 días hábiles
              </div>
            </div>
          </div>
        </div>
        <div className="relative border-t border-white/10 bg-white/[0.03]">
          <dl className="mx-auto grid max-w-6xl grid-cols-2 gap-6 px-4 py-8 sm:grid-cols-4">
            {CIFRAS.map(([n, t]) => (
              <div key={t}>
                <dt className="font-[family-name:var(--font-display)] text-3xl text-oro-300">{n}</dt>
                <dd className="text-sm text-slate-400">{t}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Servicios */}
      <section className="space-y-10">
        <div className="mx-auto max-w-2xl text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-oro-600">Servicios</p>
          <h2 className="titulo mt-2 text-3xl text-blue-900 sm:text-4xl">Todo lo legal, en un solo lugar</h2>
        </div>
        <div className="grid gap-6 md:grid-cols-3">
          {SERVICIOS.map(({ icono: Icono, t, d, href, cta }) => (
            <Link key={t} href={href} className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-7 shadow-sm transition hover:-translate-y-1 hover:border-oro-400 hover:shadow-xl">
              <span className="grid size-12 place-items-center rounded-xl bg-blue-900 text-oro-300 shadow-lg shadow-blue-900/20"><Icono className="size-6" /></span>
              <h3 className="mt-5 text-xl font-semibold text-blue-900">{t}</h3>
              <p className="mt-2 text-sm leading-relaxed text-slate-600">{d}</p>
              <p className="mt-5 inline-flex items-center gap-1.5 text-sm font-semibold text-oro-600">{cta} <Flecha className="size-4 transition group-hover:translate-x-1" /></p>
            </Link>
          ))}
        </div>
      </section>

      {/* Cómo funciona */}
      <section className="rounded-3xl bg-white p-8 shadow-sm ring-1 ring-slate-200 sm:p-12">
        <div className="grid gap-10 lg:grid-cols-[1fr_2fr]">
          <div>
            <p className="text-sm font-semibold uppercase tracking-widest text-oro-600">Cómo funciona</p>
            <h2 className="titulo mt-2 text-3xl text-blue-900">De la duda a la solución en tres pasos</h2>
          </div>
          <ol className="grid gap-6 sm:grid-cols-3">
            {PASOS.map((p, i) => (
              <li key={p.t} className="relative">
                <span className="font-[family-name:var(--font-display)] text-5xl text-oro-400/60">0{i + 1}</span>
                <h3 className="mt-2 font-semibold text-blue-900">{p.t}</h3>
                <p className="mt-1 text-sm text-slate-600">{p.d}</p>
              </li>
            ))}
          </ol>
        </div>
      </section>

      {/* Abogados */}
      <section className="ancho-total bg-tinta text-white">
        <div className="mx-auto grid max-w-6xl gap-12 px-4 py-20 lg:grid-cols-2">
          <div className="space-y-6">
            <p className="text-sm font-semibold uppercase tracking-widest text-oro-400">Para abogados</p>
            <h2 className="titulo text-3xl sm:text-4xl">Tu despacho, <span className="texto-oro">en piloto automático</span></h2>
            <ul className="space-y-4 text-slate-300">
              {[
                [Radar, "Vigilancia diaria de tus procesos en la Rama Judicial con aviso por correo"],
                [Reloj, "Términos calculados con festivos y vacancia judicial"],
                [Documento, "Minutas y formatos incluidos en tu plan"],
                [Grafica, "Clientes remitidos según tu área y calificación"],
              ].map(([Icono, t]) => {
                const I = Icono as typeof Radar;
                return <li key={t as string} className="flex gap-3"><I className="mt-0.5 size-5 shrink-0 text-oro-400" /> {t as string}</li>;
              })}
            </ul>
            <Link href="/abogados/registro" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-oro-400 to-oro-500 px-6 py-3.5 font-semibold text-tinta">Inscribirme <Flecha className="size-4" /></Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-3 lg:grid-cols-1">
            {PLANES.map((p) => (
              <Link key={p.id} href="/planes" className={`flex items-center justify-between rounded-2xl border p-5 transition hover:border-oro-400 ${p.id === "profesional" ? "border-oro-400/60 bg-oro-400/10" : "border-white/10 bg-white/5"}`}>
                <span>
                  <span className="block font-semibold">{p.nombre}</span>
                  <span className="text-xs text-slate-400">{p.procesosVigilados} procesos vigilados · {p.minutasMes ?? "∞"} minutas/mes</span>
                </span>
                <span className="font-[family-name:var(--font-display)] text-xl text-oro-300">{p.precio.replace("/mes", "")}<span className="text-xs text-slate-400">/mes</span></span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Áreas */}
      <section className="space-y-8">
        <div className="text-center">
          <p className="text-sm font-semibold uppercase tracking-widest text-oro-600">Especialidades</p>
          <h2 className="titulo mt-2 text-3xl text-blue-900">Áreas del derecho que cubrimos</h2>
        </div>
        <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {AREAS.map((a) => (
            <li key={a.id} className="rounded-xl border border-slate-200 bg-white px-5 py-4 transition hover:border-oro-400 hover:shadow-md">
              <span className="font-semibold text-blue-900">{a.nombre}</span>
              <span className="mt-1 block text-xs leading-relaxed text-slate-500">{a.ejemplos}</span>
            </li>
          ))}
        </ul>
      </section>

      {/* Llamado final */}
      <section className="fondo-hero relative overflow-hidden rounded-3xl px-8 py-14 text-center text-white">
        <div className="rejilla absolute inset-0" />
        <div className="relative space-y-5">
          <h2 className="titulo text-3xl sm:text-4xl">¿Tienes un problema legal?</h2>
          <p className="mx-auto max-w-xl text-slate-300">Recibe orientación gratuita ahora mismo y, si la necesitas, la ayuda de un abogado verificado.</p>
          <Link href="/orientacion" className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-oro-400 to-oro-500 px-7 py-4 font-semibold text-tinta shadow-xl shadow-oro-500/25">Empezar consulta gratis <Flecha className="size-4" /></Link>
        </div>
      </section>
    </div>
  );
}
