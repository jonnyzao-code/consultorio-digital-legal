import type { Metadata } from "next";
import Link from "next/link";
import { EMPRESA, VERSION_CONTRATO } from "@/lib/empresa";

export const metadata: Metadata = { title: "Contrato de vinculación de abogados · Red Legal DOMINET" };

const CLAUSULAS: [string, string[]][] = [
  [
    "Partes y objeto",
    [
      `${EMPRESA.nombre} (NIT ${EMPRESA.nit}), en adelante "la Plataforma", pone a disposición del abogado inscrito, en adelante "el Abogado", el servicio tecnológico Red Legal DOMINET: directorio de abogados, remisión de clientes, gestión de casos, vigilancia de procesos, cálculo de términos y biblioteca de formatos.`,
      "La Plataforma no es una firma de abogados ni presta servicios jurídicos. El Abogado actúa con total independencia profesional y técnica; entre las partes no existe relación laboral, de mandato ni de sociedad.",
    ],
  ],
  [
    "Requisitos y verificación",
    [
      "El Abogado declara tener tarjeta profesional vigente y no tener sanciones disciplinarias que le impidan ejercer. La Plataforma verifica la tarjeta en el Registro Nacional de Abogados antes de activar el perfil y puede repetir la verificación en cualquier momento.",
      "El Abogado se obliga a mantener actualizados sus datos y a informar de inmediato cualquier sanción o suspensión. La información falsa es causal de terminación inmediata.",
    ],
  ],
  [
    "Planes, precio y pago",
    [
      "Los servicios y límites de cada plan (Básico, Profesional y Firma) son los publicados en la página de planes al momento del pago. El precio se paga por anticipado, mensual o anual, a través de la pasarela Wompi, más IVA. La suscripción no se renueva automáticamente: la Plataforma avisa antes del vencimiento.",
      "Los precios de lanzamiento y descuentos de fundador se respetan durante el periodo ofrecido. Cualquier cambio de precio se informa con 30 días de anticipación y aplica desde el siguiente periodo.",
      "El Abogado puede retractarse dentro de los cinco (5) días hábiles siguientes al pago si no ha usado el servicio, con devolución total. Después puede cancelar en cualquier momento; el periodo ya pagado sigue vigente hasta su fin y no se reembolsa.",
    ],
  ],
  [
    "Remisión de clientes y honorarios",
    [
      "La Plataforma sugiere abogados según área, ciudad, disponibilidad y calificación de los clientes. No garantiza un número mínimo de clientes ni de casos.",
      "Los honorarios se pactan directamente entre el Abogado y su cliente, por escrito y de acuerdo con la ley. La Plataforma no cobra comisión sobre esos honorarios. Los conceptos preliminares pagados a través de la Plataforma se liquidan al Abogado revisor según la tabla publicada en su panel.",
    ],
  ],
  [
    "Deberes profesionales",
    [
      "El Abogado cumple el Código Disciplinario del Abogado (Ley 1123 de 2007): diligencia, lealtad, secreto profesional, manejo de conflictos de interés y prohibición de captar clientes por medios indebidos. Responde de forma exclusiva por su gestión ante sus clientes y autoridades.",
      "Las orientaciones automáticas, los términos calculados y las minutas son herramientas de apoyo. El Abogado debe revisar y adaptar cada documento y verificar cada término en el expediente.",
    ],
  ],
  [
    "Vigilancia de procesos",
    [
      "La información de procesos proviene de la Consulta de Procesos de la Rama Judicial y de lo que registre el Abogado. La Plataforma no responde por errores, demoras o interrupciones del portal oficial ni por actuaciones no publicadas en él. La vigilancia no reemplaza el deber del Abogado de revisar el expediente, los estados y los traslados.",
    ],
  ],
  [
    "Datos personales y confidencialidad",
    [
      `Cada parte trata los datos personales conforme a la Ley 1581 de 2012 y sus decretos. El Abogado es responsable de los datos de sus clientes y casos; la Plataforma actúa como encargada para almacenarlos con medidas de seguridad. El administrador de la Plataforma solo ve métricas agregadas, no el contenido de los expedientes. Ver la política de tratamiento de datos.`,
    ],
  ],
  [
    "Programa de referidos",
    [
      "Los referidos son de un solo nivel: quien recomienda a un abogado que se suscribe recibe un mes gratis o un cupón de descuento. No se pagan comisiones en dinero ni existen beneficios por personas referidas por terceros.",
    ],
  ],
  [
    "Suspensión y terminación",
    [
      "La Plataforma puede suspender o retirar el perfil por sanción disciplinaria, información falsa, quejas reiteradas y fundadas de clientes, uso indebido de la herramienta o falta de pago. Al terminar, el Abogado puede descargar la información de sus casos durante 30 días.",
    ],
  ],
  [
    "Responsabilidad, cambios y ley aplicable",
    [
      "La responsabilidad de la Plataforma frente al Abogado se limita al valor pagado en los tres (3) meses anteriores al hecho que la origine, salvo dolo o culpa grave.",
      "Los cambios a este contrato se informan con 30 días de anticipación; si el Abogado no los acepta puede terminar el contrato sin penalidad. Este contrato se rige por la ley colombiana. Domicilio contractual: " + EMPRESA.ciudad + ".",
    ],
  ],
];

export default function ContratoAbogados() {
  return (
    <article className="mx-auto max-w-3xl space-y-5">
      <header>
        <h1 className="text-2xl font-bold text-blue-900">Contrato de vinculación de abogados</h1>
        <p className="text-sm text-slate-500">Versión {VERSION_CONTRATO}</p>
      </header>
      {CLAUSULAS.map(([titulo, parrafos], i) => (
        <section key={titulo} className="space-y-2">
          <h2 className="font-semibold">{i + 1}. {titulo}</h2>
          {parrafos.map((p) => <p key={p.slice(0, 40)} className="text-sm leading-relaxed text-slate-700">{p}</p>)}
        </section>
      ))}
      <p className="text-sm text-slate-600">
        Contacto: {EMPRESA.correo}. Ver también los <Link href="/planes" className="underline">planes</Link> y la{" "}
        <Link href="/terminos/datos" className="underline">política de tratamiento de datos</Link>.
      </p>
    </article>
  );
}
