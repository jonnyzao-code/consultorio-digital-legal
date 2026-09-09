import { createServerFn } from "@tanstack/react-start";

export type Publicacion = {
  titulo: string;
  fecha: string | null; // ISO
  fechaTexto: string | null;
  autor: string | null;
  resumen: string | null;
  url: string;
  radicado: string | null;
};

export type ResultadoPublicaciones = {
  termino: string;
  total: number;
  publicaciones: Publicacion[];
  /** Publicaciones que coinciden con el radicado / las partes del caso. */
  coincidencias: number;
  ultimaFecha: string | null;
  error: string | null;
  consultadoEn: string;
};

export type CriterioPublicacion = {
  radicado?: string;
  demandante?: string;
  demandado?: string;
  termino?: string;
};

const MESES: Record<string, string> = {
  ene: "01", feb: "02", mar: "03", abr: "04", may: "05", jun: "06",
  jul: "07", ago: "08", sep: "09", oct: "10", nov: "11", dic: "12",
};

function parsearFechaTexto(texto: string | null): string | null {
  if (!texto) return null;
  const m = texto.match(/(\d{2})-([a-zá]{3})-(\d{4})(?:\s+(\d{1,2}):(\d{2}))?/i);
  if (!m?.[1] || !m[2] || !m[3]) return null;
  const mes = MESES[m[2].slice(0, 3).toLowerCase()];
  if (!mes) return null;
  return `${m[3]}-${mes}-${m[1]}T${(m[4] ?? "00").padStart(2, "0")}:${m[5] ?? "00"}:00-05:00`;
}

function extraerRadicado(titulo: string): string | null {
  const m = titulo.match(/(\d{4}-\d{3,5}(-\d{2})?)/);
  return m?.[1] ?? null;
}

const limpiarHtml = (s: string) =>
  s
    .replace(/<[^>]+>/g, "")
    .replace(/&amp;/g, "&")
    .replace(/&#34;|&quot;/g, '"')
    .replace(/&nbsp;/g, " ")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/\s+/g, " ")
    .trim();

const normalizar = (s: string) =>
  s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toUpperCase();

function tokens(nombre: string): string[] {
  return normalizar(nombre)
    .split(/[^A-ZÑ0-9]+/)
    .filter((t) => t.length >= 3 && !["DE", "DEL", "LA", "LAS", "LOS", "LTDA", "SAS"].includes(t));
}

/** Año y consecutivo del radicado (completo o parcial). */
function claveRadicado(rad: string): { anio: string; consecutivo: string; despacho: string | null } | null {
  const digitos = rad.replace(/\D/g, "");
  if (digitos.length >= 21) {
    return {
      despacho: digitos.slice(0, 12),
      anio: digitos.slice(12, 16),
      consecutivo: digitos.slice(16, 21),
    };
  }
  const m = rad.match(/(20\d{2}|19\d{2})\D*(\d{3,5})(?!\d)/);
  if (m?.[1] && m[2]) return { despacho: null, anio: m[1], consecutivo: m[2].padStart(5, "0") };
  return null;
}

async function buscar(termino: string): Promise<{ total: number; items: Publicacion[] }> {
  const url = `https://publicacionesprocesales.ramajudicial.gov.co/web/publicaciones-procesales/search?q=${encodeURIComponent(termino)}`;
  const res = await fetch(url, {
    headers: {
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
      Accept: "text/html",
    },
    signal: AbortSignal.timeout(20000),
  });
  if (!res.ok) throw new Error(`El portal respondió ${res.status}`);
  let html = await res.text();
  html = html.replace(/<script[\s\S]*?<\/script>/gi, "");

  let total = 0;
  const totalMatch = html.match(
    /class="search-total-label[^"]*"[^>]*>\s*([\s\S]*?)\s*<\/p>/i,
  );
  if (totalMatch?.[1]) {
    const n = limpiarHtml(totalMatch[1]).match(/([\d.]+)\s+results/i);
    if (n?.[1]) total = parseInt(n[1].replace(/\./g, ""), 10);
  }

  const bloques =
    html.match(/<li class="list-group-item list-group-item-flex[\s\S]*?<\/li>/gi) ?? [];

  const items = bloques.slice(0, 20).map((bloque) => {
    const linkMatch = bloque.match(/<h4>\s*<a href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/i);
    const titulo = linkMatch?.[2] ? limpiarHtml(linkMatch[2]) : "Publicación";
    const href = linkMatch?.[1] ? linkMatch[1].replace(/&amp;/g, "&") : "";
    const metaMatch = bloque.match(
      /<h6 class="text-default">[\s\S]*?Por <strong>([^<]*)<\/strong> el día ([^<]+)<\/h6>/i,
    );
    const autor = metaMatch?.[1] ? metaMatch[1].trim() : null;
    const fechaTexto = metaMatch?.[2] ? metaMatch[2].trim() : null;
    const snippetMatch = bloque.match(
      /<h6 class="search-document-content[^"]*">([\s\S]*?)<\/h6>/i,
    );
    const resumen = snippetMatch?.[1] ? limpiarHtml(snippetMatch[1]) : null;
    return {
      titulo,
      fecha: parsearFechaTexto(fechaTexto),
      fechaTexto,
      autor,
      resumen,
      url: href || url,
      radicado: extraerRadicado(titulo),
    };
  });
  return { total, items };
}

/** ¿La publicación pertenece realmente al caso? */
function coincide(p: Publicacion, c: CriterioPublicacion): boolean {
  const texto = normalizar(`${p.titulo} ${p.resumen ?? ""}`);
  const digitosTexto = texto.replace(/[^0-9]/g, " ");
  const clave = c.radicado ? claveRadicado(c.radicado) : null;
  if (clave) {
    const consecCorto = String(parseInt(clave.consecutivo, 10));
    const reAnioConsec = new RegExp(
      `${clave.anio}\\D{0,3}0*${consecCorto}(?!\\d)`,
    );
    if (reAnioConsec.test(texto)) {
      if (!clave.despacho) return true;
      // Con despacho conocido, exige el código del despacho o el nombre de una parte.
      if (digitosTexto.includes(clave.despacho)) return true;
      const otros: string[] = texto.match(/\b(\d{12})\b/g) ?? [];
      if (otros.length > 0 && !otros.includes(clave.despacho)) return false;
      if (nombreCoincide(texto, c)) return true;
      return false;
    }
    if (clave.despacho && digitosTexto.includes(clave.despacho)) return true;
    return false;
  }
  // Sin radicado: exige la mayoría de los tokens de una parte.
  return nombreCoincide(texto, c);
}

function nombreCoincide(texto: string, c: CriterioPublicacion): boolean {
  for (const nombre of [c.demandante, c.demandado]) {
    const ts = tokens(nombre ?? "");
    if (ts.length < 2) continue;
    const hit = ts.filter((t) => texto.includes(t)).length;
    if (hit >= Math.max(2, Math.ceil(ts.length * 0.6))) return true;
  }
  return false;
}

function terminosDeBusqueda(c: CriterioPublicacion): string[] {
  const out: string[] = [];
  const clave = c.radicado ? claveRadicado(c.radicado) : null;
  if (c.radicado?.trim()) out.push(c.radicado.trim());
  if (clave) {
    out.push(`${clave.anio}-${clave.consecutivo}`);
    if (clave.despacho) out.push(`${clave.despacho}-${clave.anio}-${clave.consecutivo}-00`);
  }
  for (const n of [c.demandante, c.demandado]) {
    const t = (n ?? "").trim();
    if (t.length >= 5) out.push(`"${t}"`);
  }
  if (out.length === 0 && (c.termino ?? "").trim().length >= 3) out.push(c.termino!.trim());
  return [...new Set(out)].slice(0, 5);
}

export const consultarPublicaciones = createServerFn({ method: "POST" })
  .inputValidator((input: { terminos: (string | CriterioPublicacion)[] }) => ({
    terminos: (input?.terminos ?? [])
      .map((t): CriterioPublicacion =>
        typeof t === "string"
          ? { termino: t.trim() }
          : {
              radicado: String(t?.radicado ?? "").trim(),
              demandante: String(t?.demandante ?? "").trim(),
              demandado: String(t?.demandado ?? "").trim(),
              termino: String(t?.termino ?? "").trim(),
            },
      )
      .slice(0, 25),
  }))
  .handler(async ({ data }) => {
    const resultados: ResultadoPublicaciones[] = await Promise.all(
      data.terminos.map(async (criterio): Promise<ResultadoPublicaciones> => {
        const terminos = terminosDeBusqueda(criterio);
        const base: ResultadoPublicaciones = {
          termino: terminos[0] ?? criterio.termino ?? "",
          total: 0,
          publicaciones: [],
          coincidencias: 0,
          ultimaFecha: null,
          error: null,
          consultadoEn: new Date().toISOString(),
        };
        if (terminos.length === 0) return base;
        try {
          const vistas = new Map<string, Publicacion>();
          let algunaOk = false;
          let ultimoError: string | null = null;
          for (const t of terminos) {
            try {
              const { total, items } = await buscar(t);
              algunaOk = true;
              base.total = Math.max(base.total, total);
              for (const it of items) {
                const k = `${it.titulo}|${it.fechaTexto ?? ""}`;
                if (!vistas.has(k)) vistas.set(k, it);
              }
            } catch (e) {
              ultimoError = e instanceof Error ? e.message : String(e);
            }
          }
          if (!algunaOk) throw new Error(ultimoError ?? "sin respuesta");

          const todas = [...vistas.values()];
          const relevantes = todas.filter((p) => coincide(p, criterio));
          const lista = (relevantes.length > 0 ? relevantes : todas).sort((a, b) =>
            String(b.fecha ?? "").localeCompare(String(a.fecha ?? "")),
          );
          base.coincidencias = relevantes.length;
          base.publicaciones = lista.slice(0, 10);
          base.ultimaFecha = relevantes[0]
            ? [...relevantes].sort((a, b) =>
                String(b.fecha ?? "").localeCompare(String(a.fecha ?? "")),
              )[0]!.fecha
            : null;
          return base;
        } catch (e) {
          return {
            ...base,
            error:
              e instanceof Error
                ? `No fue posible consultar publicaciones procesales: ${e.message}`
                : "No fue posible consultar publicaciones procesales.",
          };
        }
      }),
    );
    return { resultados };
  });
