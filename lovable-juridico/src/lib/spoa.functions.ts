import { createServerFn } from "@tanstack/react-start";

export type RegistroSpoa = {
  nunc: string | null;
  delito: string | null;
  estado: string | null;
  fecha: string | null;
  seccional: string | null;
  etapa: string | null;
};

export type ResultadoSpoa = {
  termino: string;
  estado: "encontrado" | "sin_resultados" | "no_disponible";
  mensaje: string;
  registros: RegistroSpoa[];
  enlace: string;
  consultadoEn: string;
};

const PORTAL_SPOA =
  "https://www.fiscalia.gov.co/colombia/servicios-de-informacion-al-ciudadano/consulta-de-procesos/";

// Endpoints públicos conocidos del widget de consulta SPOA.
const ENDPOINTS = [
  (n: string) =>
    `https://apiwidgets.fiscalia.gov.co/api/v1/spoa/noticia/${encodeURIComponent(n)}`,
  (n: string) =>
    `https://apiwidgets.fiscalia.gov.co/v1/noticia/consultar?nunc=${encodeURIComponent(n)}`,
  (n: string) =>
    `https://www.fiscalia.gov.co/colombia/wp-json/fiscalia/v1/spoa?nunc=${encodeURIComponent(n)}`,
];

const soloDigitos = (s: string) => s.replace(/\D/g, "");

function normalizar(item: any): RegistroSpoa {
  return {
    nunc: item?.nunc ?? item?.NUNC ?? item?.noticiaCriminal ?? null,
    delito: item?.delito ?? item?.Delito ?? item?.descripcionDelito ?? null,
    estado: item?.estado ?? item?.Estado ?? item?.estadoNoticia ?? null,
    fecha:
      item?.fechaHechos ??
      item?.fecha ??
      item?.fechaDenuncia ??
      item?.fechaUltimaActuacion ??
      null,
    seccional: item?.seccional ?? item?.Seccional ?? item?.entidad ?? null,
    etapa: item?.etapa ?? item?.Etapa ?? item?.estadoActuacion ?? null,
  };
}

async function intentar(nunc: string): Promise<RegistroSpoa[] | null> {
  for (const build of ENDPOINTS) {
    try {
      const res = await fetch(build(nunc), {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(9000),
      });
      if (!res.ok) continue;
      const ct = res.headers.get("content-type") ?? "";
      if (!ct.includes("json")) continue;
      const data: any = await res.json();
      const lista: any[] = Array.isArray(data)
        ? data
        : Array.isArray(data?.data)
          ? data.data
          : Array.isArray(data?.resultado)
            ? data.resultado
            : data && typeof data === "object"
              ? [data]
              : [];
      const registros = lista.map(normalizar).filter((r) => r.nunc || r.delito);
      return registros;
    } catch {
      // siguiente endpoint
    }
  }
  return null;
}

export const consultarSpoa = createServerFn({ method: "POST" })
  .inputValidator((data: { terminos: string[] }) => data)
  .handler(async ({ data }): Promise<{ resultados: ResultadoSpoa[] }> => {
    const resultados = await Promise.all(
      (data.terminos ?? []).map(async (termino): Promise<ResultadoSpoa> => {
        const base: Omit<ResultadoSpoa, "estado" | "mensaje" | "registros"> = {
          termino,
          enlace: PORTAL_SPOA,
          consultadoEn: new Date().toISOString(),
        };
        const nunc = soloDigitos(termino ?? "");
        if (nunc.length < 20) {
          return {
            ...base,
            estado: "no_disponible",
            registros: [],
            mensaje:
              "Para consultar en el SPOA necesitas el NUNC (noticia criminal) de 21 dígitos. Con nombre o cédula la Fiscalía exige registro y captcha en su portal.",
          };
        }
        const registros = await intentar(nunc);
        if (registros === null) {
          return {
            ...base,
            estado: "no_disponible",
            registros: [],
            mensaje:
              "El servicio de consulta SPOA de la Fiscalía no respondió (requiere captcha o está restringido). Abre el portal con el NUNC copiado para verificar manualmente.",
          };
        }
        if (registros.length === 0) {
          return {
            ...base,
            estado: "sin_resultados",
            registros: [],
            mensaje:
              "El SPOA no reporta una noticia criminal pública con ese NUNC. Verifica el número o consulta directamente en el portal.",
          };
        }
        return {
          ...base,
          estado: "encontrado",
          registros,
          mensaje: `Se encontraron ${registros.length} registro(s) en el SPOA.`,
        };
      }),
    );
    return { resultados };
  });
