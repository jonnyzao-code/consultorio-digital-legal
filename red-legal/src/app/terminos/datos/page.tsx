import type { Metadata } from "next";
import { EMPRESA } from "@/lib/empresa";

export const metadata: Metadata = { title: "Tratamiento de datos personales · Red Legal DOMINET" };

const SECCIONES: [string, string][] = [
  ["Responsable", `${EMPRESA.nombre}, NIT ${EMPRESA.nit}, ${EMPRESA.ciudad}. Correo: ${EMPRESA.correo}.`],
  [
    "Datos que tratamos",
    "Nombre, correo, celular, ciudad y, en el caso de abogados, número de tarjeta profesional y áreas de práctica. En las consultas, la descripción del problema que usted escribe, que puede incluir datos sensibles; le recomendamos no incluir números de documento ni datos de terceros que no sean necesarios.",
  ],
  [
    "Finalidades",
    "Prestar la orientación preliminar, remitirle a un abogado inscrito, gestionar casos, términos y pagos, verificar la tarjeta profesional, enviar alertas y avisos del servicio, atender peticiones y medir la calidad del servicio con métricas agregadas.",
  ],
  [
    "Inteligencia artificial y terceros",
    "La orientación automática se procesa con un proveedor de inteligencia artificial y los pagos con Wompi. Los datos se almacenan en servidores de Supabase y Cloudflare, que pueden estar fuera de Colombia, con medidas de seguridad adecuadas. No vendemos sus datos.",
  ],
  [
    "Sus derechos",
    "Conocer, actualizar y rectificar sus datos; pedir prueba de la autorización; ser informado del uso; presentar quejas ante la Superintendencia de Industria y Comercio; revocar la autorización y pedir la supresión cuando no exista un deber legal o contractual de conservarlos.",
  ],
  [
    "Cómo ejercerlos",
    `Escriba a ${EMPRESA.correo}. Respondemos consultas en máximo 10 días hábiles y reclamos en máximo 15 días hábiles, según los artículos 14 y 15 de la Ley 1581 de 2012.`,
  ],
];

export default function PoliticaDatos() {
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <h1 className="text-2xl font-bold text-blue-900">Política de tratamiento de datos personales</h1>
      {SECCIONES.map(([titulo, texto]) => (
        <section key={titulo}>
          <h2 className="font-semibold">{titulo}</h2>
          <p className="text-sm leading-relaxed text-slate-700">{texto}</p>
        </section>
      ))}
    </article>
  );
}
