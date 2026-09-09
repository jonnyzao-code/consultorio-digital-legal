import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { QueryProvider } from "@/providers/QueryProvider";
import { AuthProvider } from "@/providers/AuthProvider";

const inter = Inter({ subsets: ["latin"], variable: "--font-inter" });

export const metadata: Metadata = {
  title: "Consultorio Digital Legal - Asesoría Legal en Colombia",
  description:
    "Plataforma de servicios legales digitales. Accede a tutelas, derechos de petición, contratos y asesoría jurídica profesional desde cualquier lugar de Colombia.",
  keywords: "abogado, asesoría legal, tutela, derecho de petición, Colombia, consulta jurídica",
  openGraph: {
    title: "Consultorio Digital Legal",
    description: "Democratizando el acceso a la justicia en Colombia",
    type: "website",
    locale: "es_CO",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="es" className={inter.variable}>
      <body className="font-sans antialiased bg-white text-gray-900">
        <QueryProvider>
          <AuthProvider>{children}</AuthProvider>
        </QueryProvider>
      </body>
    </html>
  );
}
