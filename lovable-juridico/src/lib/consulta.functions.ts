import { createServerFn } from "@tanstack/react-start";

const BASE = "https://consultaprocesos.ramajudicial.gov.co:448/api/v2";

export type Actuacion = {
  fechaActuacion: string | null;
  actuacion: string | null;
  anotacion: string | null;
  fechaRegistro: string | null;
};

export type ResultadoConsulta = {
  numero: string;
  encontrado: boolean;
  error: string | null;
  consultadoEn: string;
  idProceso: number | null;
  despacho: string | null;
  departamento: string | null;
  sujetos: string | null;
  fechaProceso: string | null;
  fechaUltimaActuacion: string | null;
  tipoProceso: string | null;
  claseProceso: string | null;
  ponente: string | null;
  ubicacion: string | null;
  actuaciones: Actuacion[];
};

async function getJson(url: string): Promise<any> {
  let ultimo: unknown = null;
  for (let intento = 0; intento < 3; intento++) {
    try {
      const res = await fetch(url, {
        headers: { Accept: "application/json" },
        signal: AbortSignal.timeout(15000),
      });
      if (res.status >= 500) throw new Error(`El portal respondió ${res.status}`);
      if (!res.ok) throw new Error(`El portal respondió ${res.status}`);
      return await res.json();
    } catch (e) {
      ultimo = e;
      await new Promise((r) => setTimeout(r, 800 * (intento + 1)));
    }
  }
  throw ultimo instanceof Error ? ultimo : new Error("El portal no respondió");
}

function vacio(numeroRaw: string): ResultadoConsulta {
  return {
    numero: numeroRaw,
    encontrado: false,
    error: null,
    consultadoEn: new Date().toISOString(),
    idProceso: null,
    despacho: null,
    departamento: null,
    sujetos: null,
    fechaProceso: null,
    fechaUltimaActuacion: null,
    tipoProceso: null,
    claseProceso: null,
    ponente: null,
    ubicacion: null,
    actuaciones: [],
  };
}

async function buscarPorNumero(numero: string): Promise<any[]> {
  const lista = await getJson(
    `${BASE}/Procesos/Consulta/NumeroRadicacion?numero=${numero}&SoloActivos=false&pagina=1`,
  );
  return Array.isArray(lista?.procesos) ? lista.procesos : [];
}

async function buscarPorNombre(nombre: string): Promise<any[]> {
  const q = encodeURIComponent(nombre.trim());
  const acumulado: any[] = [];
  for (const tipo of ["nat", "jur"]) {
    for (let pagina = 1; pagina <= 2; pagina++) {
      try {
        const lista = await getJson(
          `${BASE}/Procesos/Consulta/NombreRazonSocial?nombre=${q}&tipoPersona=${tipo}&SoloActivos=false&pagina=${pagina}`,
        );
        const arr = Array.isArray(lista?.procesos) ? lista.procesos : [];
        acumulado.push(...arr);
        const paginas = Number(lista?.paginacion?.cantidadPaginas ?? 1);
        if (arr.length === 0 || pagina >= paginas) break;
      } catch {
        break;
      }
    }
    if (acumulado.length > 0) break;
  }
  return acumulado;
}

const quitarTildes = (s: string) =>
  s
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toUpperCase();

/** Palabras significativas de un nombre (ignora conectores). */
function tokens(nombre: string): string[] {
  return quitarTildes(nombre)
    .split(/[^A-ZÑ0-9]+/)
    .filter((t) => t.length >= 3 && !["DE", "DEL", "LA", "LAS", "LOS", "LTDA", "SAS", "S.A", "THE"].includes(t));
}

/** Variantes de nombre a consultar: el texto completo y cada persona si hay varias. */
function variantesNombre(nombre: string): string[] {
  const limpio = nombre.trim();
  if (!limpio) return [];
  const partes = limpio
    .split(/\s+(?:y|Y|e|&)\s+|\s*[,;/]\s*/)
    .map((p) => p.trim())
    .filter((p) => p.length >= 5);
  const set = new Set<string>([limpio, ...partes]);
  return [...set].slice(0, 4);
}

/** Puntúa qué tan bien coincide un proceso con los datos del caso. */
function puntuar(
  p: any,
  ctx: { anio: string | null; consecutivo: string | null; nombres: string[] },
): number {
  let score = 0;
  const llave = String(p.llaveProceso ?? "");
  const sujetos = quitarTildes(String(p.sujetosProcesales ?? ""));
  if (ctx.anio && ctx.consecutivo) {
    if (llave.slice(12, 16) === ctx.anio && llave.slice(16, 21) === ctx.consecutivo)
      score += 100;
    else if (llave.includes(ctx.anio + ctx.consecutivo)) score += 80;
    else if (llave.slice(12, 16) === ctx.anio) score += 5;
  } else if (ctx.anio && llave.slice(12, 16) === ctx.anio) score += 5;
  for (const nombre of ctx.nombres) {
    const ts = tokens(nombre);
    if (ts.length === 0) continue;
    const hit = ts.filter((t) => sujetos.includes(t)).length;
    score += Math.round((hit / ts.length) * 30);
  }
  return score;
}

async function consultarUno(item: {
  numero: string;
  nombre?: string;
  demandante?: string;
  demandado?: string;
}): Promise<ResultadoConsulta> {
  const numeroRaw = item.numero ?? "";
  const numero = numeroRaw.replace(/\D/g, "");
  const nombres = [item.demandante, item.demandado, item.nombre]
    .map((n) => (n ?? "").trim())
    .filter((n, i, arr) => n.length >= 5 && arr.indexOf(n) === i);
  const base = vacio(numeroRaw);

  // Año y consecutivo del radicado (completo o parcial, p. ej. 2024-00283).
  let anio: string | null = null;
  let consecutivo: string | null = null;
  if (numero.length >= 21) {
    anio = numero.slice(12, 16);
    consecutivo = numero.slice(16, 21);
  } else {
    const m = numeroRaw.match(/(20\d{2}|19\d{2})\D*(\d{3,5})(?!\d)/);
    if (m?.[1] && m[2]) {
      anio = m[1];
      consecutivo = m[2].padStart(5, "0");
    }
  }
  const ctx = { anio, consecutivo, nombres };

  try {
    let procesos: any[] = [];
    let via = "";
    const intentados: string[] = [];

    // 1) Radicado de 23 dígitos, o de 21 (sin instancia) probando -00 y -01.
    const candidatos =
      numero.length === 23
        ? [numero]
        : numero.length === 21
          ? [`${numero}00`, `${numero}01`]
          : [];
    for (const cand of candidatos) {
      intentados.push(cand);
      procesos = await buscarPorNumero(cand);
      if (procesos.length > 0) {
        via = "radicado";
        break;
      }
    }

    // 2) Búsqueda exhaustiva por demandante y demandado, con filtros.
    if (procesos.length === 0 && nombres.length > 0) {
      const vistos = new Map<string, any>();
      const variantes = [...new Set(nombres.flatMap(variantesNombre))].slice(0, 6);
      const listas = await Promise.all(
        variantes.map((v) => buscarPorNombre(v).catch(() => [] as any[])),
      );
      for (const arr of listas) {
        for (const p of arr) {
          const k = String(p.idProceso ?? p.llaveProceso);
          if (!vistos.has(k)) vistos.set(k, p);
        }
      }
      const todos = [...vistos.values()];
      if (todos.length > 0) {
        via = "nombre";
        const puntuados = todos
          .map((p) => ({ p, s: puntuar(p, ctx) }))
          .sort(
            (a, b) =>
              b.s - a.s ||
              String(b.p.fechaUltimaActuacion ?? "").localeCompare(
                String(a.p.fechaUltimaActuacion ?? ""),
              ),
          );
        const mejor = puntuados[0]!.s;
        // Si hay coincidencia por radicado parcial (>=80) nos quedamos solo con esas.
        procesos = puntuados
          .filter((x) => (mejor >= 80 ? x.s >= 80 : x.s >= Math.max(10, mejor - 10)))
          .map((x) => x.p);
      }
    }

    if (procesos.length === 0) {
      let error = "No se encontró el proceso en la Rama Judicial.";
      if (numero.length < 21 && nombres.length === 0) {
        error =
          "Para la consulta automática ingresa el radicado de 23 dígitos (o 21 sin instancia) o el nombre completo del demandante o demandado.";
      } else if (numero.length < 21) {
        error = `No se hallaron procesos a nombre de ${nombres.map((n) => `"${n}"`).join(" ni ")} en Consulta de Procesos. Se revisan además las publicaciones procesales del despacho.`;
      } else {
        error = `El radicado ${intentados.join(" / ")} no aparece en Consulta de Procesos de la Rama Judicial (despacho no integrado, proceso privado o de otra entidad). Se revisan además las publicaciones procesales.`;
      }
      return { ...base, error };
    }

    const p = procesos[0];

    const resultado: ResultadoConsulta = {
      ...base,
      encontrado: true,
      numero: numeroRaw || String(p.llaveProceso ?? ""),
      error:
        via === "nombre"
          ? `Encontrado por nombre. Radicado hallado: ${p.llaveProceso ?? "—"}${
              procesos.length > 1
                ? ` (${procesos.length} procesos coinciden con demandante/demandado; se muestra el más afín y reciente)`
                : ""
            }`
          : intentados.length > 1 && via === "radicado"
            ? `Radicado completado con instancia: ${p.llaveProceso ?? "—"}`
            : null,
      idProceso: p.idProceso ?? null,
      despacho: p.despacho?.trim() ?? null,
      departamento: p.departamento ?? null,
      sujetos: p.sujetosProcesales?.trim() ?? null,
      fechaProceso: p.fechaProceso ?? null,
      fechaUltimaActuacion: p.fechaUltimaActuacion ?? null,
    };

    const [detalle, actuaciones] = await Promise.allSettled([
      getJson(`${BASE}/Proceso/Detalle/${p.idProceso}`),
      getJson(`${BASE}/Proceso/Actuaciones/${p.idProceso}?pagina=1`),
    ]);

    if (detalle.status === "fulfilled" && detalle.value) {
      const d = detalle.value;
      resultado.tipoProceso = d.tipoProceso ?? null;
      resultado.claseProceso = d.claseProceso ?? null;
      resultado.ponente = d.ponente ?? null;
      resultado.ubicacion = d.ubicacion ?? null;
    }
    if (actuaciones.status === "fulfilled") {
      const arr: any[] = Array.isArray(actuaciones.value?.actuaciones)
        ? actuaciones.value.actuaciones
        : [];
      resultado.actuaciones = arr.slice(0, 8).map((a) => ({
        fechaActuacion: a.fechaActuacion ?? null,
        actuacion: a.actuacion ?? null,
        anotacion: a.anotacion ?? null,
        fechaRegistro: a.fechaRegistro ?? null,
      }));
      if (resultado.actuaciones[0]?.fechaActuacion) {
        resultado.fechaUltimaActuacion = resultado.actuaciones[0].fechaActuacion;
      }
    }

    return resultado;
  } catch (e) {
    return {
      ...base,
      error:
        e instanceof Error
          ? `El portal de Consulta de Procesos de la Rama Judicial no respondió (${e.message}). Es intermitente: se reintenta en la próxima revisión automática.`
          : "El portal de Consulta de Procesos no respondió; se reintenta en la próxima revisión.",
    };
  }
}

export const consultarProcesos = createServerFn({ method: "POST" })
  .inputValidator(
    (input: {
      numeros: {
        numero: string;
        nombre?: string;
        demandante?: string;
        demandado?: string;
      }[];
    }) => ({
      numeros: (input?.numeros ?? [])
        .map((n) =>
          typeof n === "string"
            ? { numero: n as string, nombre: "", demandante: "", demandado: "" }
            : {
                numero: String(n?.numero ?? ""),
                nombre: String(n?.nombre ?? ""),
                demandante: String(n?.demandante ?? ""),
                demandado: String(n?.demandado ?? ""),
              },
        )
        .slice(0, 25),
    }),
  )
  .handler(async ({ data }) => {
    const resultados = await Promise.all(data.numeros.map(consultarUno));
    return { resultados };
  });

