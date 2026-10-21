import { CONSTITUCIONALES } from "./constitucionales";
import { CONTRATOS } from "./contratos";
import { PROCESALES } from "./procesales";
import { TITULOS } from "./titulos";
import type { Categoria, Minuta } from "./tipos";

export type { Campo, Minuta } from "./tipos";

export const CATEGORIAS: Record<Categoria, string> = {
  peticiones: "Peticiones",
  constitucionales: "Acciones constitucionales",
  contratos: "Contratos",
  titulos: "Títulos valores",
  procesales: "Escritos procesales y poderes",
  consumidor: "Consumidor",
};

export const MINUTAS: Minuta[] = [...CONSTITUCIONALES, ...CONTRATOS, ...TITULOS, ...PROCESALES];

export const minuta = (id: string) => MINUTAS.find((m) => m.id === id);

const BLANCO = "____________________";

/** Reemplaza los marcadores {{campo}} con los valores; los vacíos quedan como línea para llenar a mano. */
export function llenar(texto: string, valores: Record<string, string>) {
  return texto.replace(/\{\{(\w+)\}\}/g, (_, id: string) => valores[id]?.trim() || BLANCO);
}
