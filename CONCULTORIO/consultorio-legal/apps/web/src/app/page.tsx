import Link from "next/link";
import {
  Scale, Shield, FileText, Users, Clock, ChevronRight,
  CheckCircle, Star, ArrowRight, Phone, Mail, MapPin
} from "lucide-react";

const ramas = [
  { nombre: "Derecho Penal", icono: Shield, desc: "Defensa en procesos penales, víctimas de delitos, denuncia ante la Fiscalía.", color: "bg-red-50 text-red-700 border-red-200" },
  { nombre: "Derecho Civil", icono: FileText, desc: "Contratos, deudas, propiedades, sucesiones y responsabilidad civil.", color: "bg-blue-50 text-blue-700 border-blue-200" },
  { nombre: "Derecho Laboral", icono: Users, desc: "Despidos, liquidaciones, acoso laboral, prestaciones sociales.", color: "bg-green-50 text-green-700 border-green-200" },
  { nombre: "Derecho de Familia", icono: Scale, desc: "Divorcios, custodia de hijos, alimentos, adopción, violencia intrafamiliar.", color: "bg-purple-50 text-purple-700 border-purple-200" },
  { nombre: "Derecho Administrativo", icono: Clock, desc: "Tutelas contra entidades públicas, derechos de petición, sanciones.", color: "bg-orange-50 text-orange-700 border-orange-200" },
];

const pasos = [
  { n: "01", titulo: "Describe tu caso", desc: "Escribe con tus propias palabras qué está pasando. No necesitas saber de leyes." },
  { n: "02", titulo: "La IA clasifica", desc: "Nuestro sistema identifica automáticamente qué tipo de caso tienes y qué necesitas." },
  { n: "03", titulo: "Abogado asignado", desc: "Un abogado especializado en tu área revisa tu caso y prepara la solución." },
  { n: "04", titulo: "Solución entregada", desc: "Recibes tu documento legal o asesoría lista para usar, sin salir de casa." },
];

const planes = [
  {
    nombre: "Consulta Puntual",
    precio: "$25.000",
    periodo: "por consulta",
    features: ["1 consulta con abogado", "Clasificación automática por IA", "Orientación básica", "Respuesta en 24h"],
    cta: "Consultar ahora",
    destacado: false,
  },
  {
    nombre: "Plan Básico",
    precio: "$89.000",
    periodo: "/mes",
    features: ["3 consultas mensuales", "1 documento generado (tutela o D. petición)", "Monitoreo de 1 proceso judicial", "Alertas por WhatsApp y correo", "Soporte prioritario"],
    cta: "Empezar plan",
    destacado: true,
  },
  {
    nombre: "Plan Familia",
    precio: "$149.000",
    periodo: "/mes",
    features: ["Consultas ilimitadas", "3 documentos mensuales", "Monitoreo de 5 procesos", "Cálculo de cuota de alimentos", "App móvil incluida", "Abogado dedicado"],
    cta: "Elegir Plan Familia",
    destacado: false,
  },
];

export default function HomePage() {
  return (
    <main className="min-h-screen bg-white">
      {/* ─── Navbar ─────────────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full bg-white/95 backdrop-blur border-b border-gray-100 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Scale className="h-7 w-7 text-primary" />
            <span className="font-bold text-xl text-primary">Consultorio Digital Legal</span>
          </div>
          <div className="hidden md:flex items-center gap-8">
            <a href="#servicios" className="text-gray-600 hover:text-primary transition-colors text-sm font-medium">Servicios</a>
            <a href="#como-funciona" className="text-gray-600 hover:text-primary transition-colors text-sm font-medium">¿Cómo funciona?</a>
            <a href="#precios" className="text-gray-600 hover:text-primary transition-colors text-sm font-medium">Precios</a>
          </div>
          <div className="flex items-center gap-3">
            <Link href="/login" className="text-primary font-medium text-sm hover:underline">Iniciar sesión</Link>
            <Link href="/registro" className="btn-primary text-sm py-2 px-4">Registrarse gratis</Link>
          </div>
        </div>
      </nav>

      {/* ─── Hero ───────────────────────────────────────────────────── */}
      <section className="pt-32 pb-20 bg-gradient-to-br from-primary via-primary/95 to-accent">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="inline-flex items-center gap-2 bg-white/10 text-white text-sm font-medium px-4 py-1.5 rounded-full mb-6 border border-white/20">
            <Shield className="h-4 w-4" />
            <span>Plataforma certificada · Ley 1581 de Habeas Data</span>
          </div>
          <h1 className="text-4xl md:text-6xl font-bold text-white mb-6 leading-tight">
            Accede a tu derecho,<br />
            <span className="text-secondary">desde donde estás</span>
          </h1>
          <p className="text-xl text-white/80 mb-10 max-w-2xl mx-auto">
            La primera plataforma de servicios legales digitales para Colombia. 
            Abogados verificados, documentos generados por IA y monitoreo de procesos judiciales.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/registro"
              className="inline-flex items-center gap-2 bg-secondary hover:bg-secondary/90 text-white font-bold px-8 py-4 rounded-xl text-lg transition-colors shadow-lg"
            >
              Consultar ahora — desde $25.000 COP
              <ArrowRight className="h-5 w-5" />
            </Link>
            <a
              href="#como-funciona"
              className="inline-flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-medium px-8 py-4 rounded-xl text-lg transition-colors border border-white/30"
            >
              ¿Cómo funciona?
              <ChevronRight className="h-5 w-5" />
            </a>
          </div>
        </div>
      </section>

      {/* ─── Stats ──────────────────────────────────────────────────── */}
      <section className="py-14 bg-gray-50 border-y border-gray-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            {[
              { valor: "2.500+", label: "Consultas resueltas" },
              { valor: "120+", label: "Abogados verificados" },
              { valor: "8.000+", label: "Documentos generados" },
              { valor: "94%", label: "Satisfacción del cliente" },
            ].map((stat) => (
              <div key={stat.label}>
                <p className="text-3xl md:text-4xl font-bold text-primary">{stat.valor}</p>
                <p className="text-gray-500 text-sm mt-1">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Servicios ──────────────────────────────────────────────── */}
      <section id="servicios" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Áreas de práctica legal</h2>
            <p className="text-gray-500 text-lg max-w-xl mx-auto">Abogados especializados en cada rama del derecho colombiano, listos para atenderte.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {ramas.map((rama) => (
              <div key={rama.nombre} className={`card-legal border ${rama.color.split(" ")[2]}`}>
                <div className={`inline-flex p-3 rounded-lg ${rama.color.split(" ")[0]} mb-4`}>
                  <rama.icono className={`h-6 w-6 ${rama.color.split(" ")[1]}`} />
                </div>
                <h3 className="font-bold text-gray-900 text-lg mb-2">{rama.nombre}</h3>
                <p className="text-gray-500 text-sm">{rama.desc}</p>
                <Link href="/registro" className="inline-flex items-center gap-1 text-sm font-medium text-primary mt-4 hover:underline">
                  Consultar <ChevronRight className="h-4 w-4" />
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Cómo funciona ──────────────────────────────────────────── */}
      <section id="como-funciona" className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">¿Cómo funciona?</h2>
            <p className="text-gray-500 text-lg">Del problema a la solución en 4 pasos simples.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {pasos.map((paso, i) => (
              <div key={paso.n} className="relative text-center">
                {i < pasos.length - 1 && (
                  <div className="hidden lg:block absolute top-8 left-1/2 w-full h-0.5 bg-primary/20" />
                )}
                <div className="relative inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-white font-bold text-xl mb-4 shadow-lg">
                  {paso.n}
                </div>
                <h3 className="font-bold text-gray-900 mb-2">{paso.titulo}</h3>
                <p className="text-gray-500 text-sm">{paso.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Precios ────────────────────────────────────────────────── */}
      <section id="precios" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-14">
            <h2 className="text-3xl md:text-4xl font-bold text-gray-900 mb-4">Planes y precios</h2>
            <p className="text-gray-500 text-lg">Justicia accesible para todos los colombianos.</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {planes.map((plan) => (
              <div
                key={plan.nombre}
                className={`rounded-2xl p-8 border-2 relative ${
                  plan.destacado
                    ? "border-primary bg-primary text-white shadow-xl scale-105"
                    : "border-gray-200 bg-white"
                }`}
              >
                {plan.destacado && (
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-secondary text-white text-xs font-bold px-3 py-1 rounded-full">
                    MÁS POPULAR
                  </span>
                )}
                <h3 className={`font-bold text-xl mb-2 ${plan.destacado ? "text-white" : "text-gray-900"}`}>
                  {plan.nombre}
                </h3>
                <div className="mb-6">
                  <span className={`text-4xl font-bold ${plan.destacado ? "text-white" : "text-primary"}`}>
                    {plan.precio}
                  </span>
                  <span className={`text-sm ml-1 ${plan.destacado ? "text-white/70" : "text-gray-400"}`}>
                    {plan.periodo}
                  </span>
                </div>
                <ul className="space-y-3 mb-8">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-2">
                      <CheckCircle className={`h-5 w-5 flex-shrink-0 mt-0.5 ${plan.destacado ? "text-secondary" : "text-accent"}`} />
                      <span className={`text-sm ${plan.destacado ? "text-white/90" : "text-gray-600"}`}>{f}</span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/registro"
                  className={`block text-center py-3 px-6 rounded-xl font-semibold transition-colors ${
                    plan.destacado
                      ? "bg-secondary hover:bg-secondary/90 text-white"
                      : "bg-primary hover:bg-primary/90 text-white"
                  }`}
                >
                  {plan.cta}
                </Link>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ─── Footer ─────────────────────────────────────────────────── */}
      <footer className="bg-primary text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8 mb-8">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <Scale className="h-6 w-6 text-secondary" />
                <span className="font-bold text-lg">Consultorio Digital Legal</span>
              </div>
              <p className="text-white/60 text-sm">
                Democratizando el acceso a la justicia en Colombia.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Servicios</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                {ramas.slice(0, 4).map((r) => <li key={r.nombre}>{r.nombre}</li>)}
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Legal</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li>Términos y condiciones</li>
                <li>Política de privacidad</li>
                <li>Ley 1581 - Habeas Data</li>
                <li>Aviso de privacidad</li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-3">Contacto</h4>
              <ul className="space-y-2 text-white/60 text-sm">
                <li className="flex items-center gap-2"><Mail className="h-4 w-4" /> info@consultoriodigital.co</li>
                <li className="flex items-center gap-2"><Phone className="h-4 w-4" /> +57 300 000 0000</li>
                <li className="flex items-center gap-2"><MapPin className="h-4 w-4" /> Colombia</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-white/10 pt-6 text-center text-white/40 text-sm">
            © 2025 Consultorio Digital Legal. Todos los derechos reservados. · Protegido por Ley 1581 de 2012
          </div>
        </div>
      </footer>
    </main>
  );
}
