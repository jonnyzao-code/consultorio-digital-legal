export type TipoCampo = "texto" | "parrafo" | "fecha" | "numero" | "dinero";

export type Campo = { id: string; etiqueta: string; tipo: TipoCampo; ejemplo?: string };

export type Categoria = "peticiones" | "constitucionales" | "contratos" | "titulos" | "procesales" | "consumidor";

export type Minuta = {
  id: string;
  titulo: string;
  categoria: Categoria;
  descripcion: string;
  baseLegal: string;
  notas: string[];
  campos: Campo[];
  /** Texto con marcadores {{campo}}. */
  texto: string;
};

/** Atajo para declarar campos: c("nombre", "Nombre completo", "texto", "Ana Pérez"). */
export const c = (id: string, etiqueta: string, tipo: TipoCampo = "texto", ejemplo?: string): Campo => ({ id, etiqueta, tipo, ejemplo });

// Campos que se repiten en casi todos los formatos.
export const LUGAR_FECHA = [c("ciudad", "Ciudad", "texto", "Bogotá D.C."), c("fecha", "Fecha", "fecha")];
