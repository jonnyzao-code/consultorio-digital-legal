import type { Metadata } from "next";
import Link from "next/link";
import "./globals.css";

export const metadata: Metadata = {
  title: "Red Legal DOMINET",
  description:
    "Orientación legal con IA y abogados verificados en Colombia, por áreas del derecho.",
};

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="es">
      <body className="min-h-screen bg-slate-50 text-slate-900 antialiased">
        <header className="border-b bg-white">
          <nav className="mx-auto flex max-w-5xl items-center justify-between px-4 py-3">
            <Link href="/" className="font-semibold text-blue-900">
              Red Legal DOMINET
            </Link>
            <div className="flex gap-4 text-sm">
              <Link href="/orientacion">Tengo un problema legal</Link>
              <Link href="/abogados/registro">Soy abogado</Link>
            </div>
          </nav>
        </header>
        <main className="mx-auto max-w-5xl px-4 py-8">{children}</main>
        <footer className="mx-auto max-w-5xl px-4 py-8 text-xs text-slate-500">
          Red Legal DOMINET es un servicio tecnológico que conecta clientes con
          abogados independientes inscritos. La orientación automática es
          informativa y no constituye concepto jurídico.
        </footer>
      </body>
    </html>
  );
}
