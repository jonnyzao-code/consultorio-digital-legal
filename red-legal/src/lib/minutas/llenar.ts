const BLANCO = "____________________";

/** Reemplaza los marcadores {{campo}} con los valores; los vacíos quedan como línea para llenar a mano. */
export function llenar(texto: string, valores: Record<string, string>) {
  return texto.replace(/\{\{(\w+)\}\}/g, (_, id: string) => valores[id]?.trim() || BLANCO);
}
