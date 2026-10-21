import type { Metadata } from "next";
import { Inter, Playfair_Display } from "next/font/google";
import Link from "next/link";
import { Chat } from "@/components/chat";
import { Balanza } from "@/components/iconos";
import { EMPRESA } from "@/lib/empresa";
import "./globals.css";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });
const playfair = Playfair_Display({ subsets: ["latin"], variable: "--font-playfair" });

export const metadata: Metadata = {
  title: "Red Legal DOMINET",
  description: "Orientación legal con IA, abogados verificados, vigilancia de procesos y minutas jurídicas en Colombia.",
};

const MENU = [
  ["/orientacion", "Orientación con IA"],
  ["/minutas", "Minutas y formatos"],
  ["/planes", "Para abogados"],
] as const;

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es" className={`${inter.variable} ${playfair.variable}`}>
      <body className="min-h-screen text-slate-900 antialiased">
        <header className="sticky top-0 z-40 border-b border-white/10 bg-tinta/90 text-white backdrop-blur-xl print:hidden">
          <nav className="mx-auto flex max-w-6xl items-center justify-between gap-4 px-4 py-3">
            <Link href="/" className="flex items-center gap-2.5">
              <span className="grid size-9 place-items-center rounded-lg bg-gradient-to-br from-oro-300 to-oro-600 text-tinta shadow-lg shadow-oro-500/20">
                <Balanza className="size-5" />
              </span>
              <span className="leading-tight">
                <span className="block font-[family-name:var(--font-display)] text-lg">Red Legal</span>
                <span className="block text-[10px] font-semibold tracking-[0.3em] text-oro-400">DOMINET</span>
              </span>
            </Link>
            <div className="hidden items-center gap-1 text-sm md:flex">
              {MENU.map(([href, nombre]) => (
                <Link key={href} href={href} className="rounded-md px-3 py-2 text-slate-300 transition hover:bg-white/5 hover:text-white">{nombre}</Link>
              ))}
            </div>
            <div className="flex items-center gap-2 text-sm">
              <Link href="/panel" className="rounded-md px-3 py-2 text-slate-200 hover:text-white">Ingresar</Link>
              <Link href="/orientacion" className="hidden rounded-lg bg-gradient-to-r from-oro-400 to-oro-500 px-4 py-2 font-semibold text-tinta shadow-lg shadow-oro-500/20 transition hover:brightness-110 sm:block">
                Consulta gratis
              </Link>
            </div>
          </nav>
          <div className="flex justify-center gap-1 overflow-x-auto border-t border-white/5 px-4 py-1.5 text-xs md:hidden">
            {MENU.map(([href, nombre]) => (
              <Link key={href} href={href} className="whitespace-nowrap rounded-md px-3 py-1.5 text-slate-300">{nombre}</Link>
            ))}
          </div>
        </header>
        <main className="mx-auto max-w-6xl px-4 py-10">{children}</main>
        <footer className="bg-tinta text-slate-400 print:hidden">
          <div className="mx-auto grid max-w-6xl gap-8 px-4 py-12 text-sm sm:grid-cols-3">
            <div className="space-y-3">
              <p className="flex items-center gap-2 text-white"><Balanza className="size-5 text-oro-400" /> <span className="font-[family-name:var(--font-display)] text-lg">Red Legal DOMINET</span></p>
              <p className="text-xs leading-relaxed">Servicio tecnológico que conecta clientes con abogados independientes inscritos. La orientación automática es informativa y no constituye concepto jurídico.</p>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-white">Servicios</p>
              <Link href="/orientacion" className="block hover:text-white">Orientación con IA</Link>
              <Link href="/minutas" className="block hover:text-white">Minutas y formatos</Link>
              <Link href="/planes" className="block hover:text-white">Planes para abogados</Link>
            </div>
            <div className="space-y-2">
              <p className="font-semibold text-white">Legal</p>
              <Link href="/terminos/abogados" className="block hover:text-white">Contrato de abogados</Link>
              <Link href="/terminos/datos" className="block hover:text-white">Tratamiento de datos</Link>
              <p className="text-xs">{EMPRESA.nombre} · NIT {EMPRESA.nit}<br />{EMPRESA.correo} · {EMPRESA.ciudad}</p>
            </div>
          </div>
          <p className="border-t border-white/5 py-4 text-center text-xs">© {new Date().getFullYear()} {EMPRESA.nombre}. Todos los derechos reservados.</p>
        </footer>
        <Chat />
      </body>
    </html>
  );
}
