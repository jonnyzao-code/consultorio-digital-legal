// Precio por documento en pesos, IVA incluido. Incluidas sin costo en todos los planes de abogados.
const TARIFAS: Record<string, number> = {
  "derecho-de-peticion": 9_900,
  "reclamo-garantia": 9_900,
  "acuerdo-de-pago": 9_900,
  "carta-de-instrucciones": 9_900,
  "letra-de-cambio": 14_900,
  pagare: 14_900,
  "poder-especial": 14_900,
  "arrendamiento-vivienda": 14_900,
  "prestacion-de-servicios": 14_900,
  "compraventa-vehiculo": 14_900,
  "contrato-trabajo-termino-fijo": 14_900,
  "promesa-de-compraventa": 19_900,
  "recurso-de-reposicion": 19_900,
  "incidente-de-desacato": 19_900,
  "accion-de-tutela": 24_900,
  "accion-popular": 24_900,
  "accion-de-grupo": 24_900,
};

export const precioMinuta = (id: string) => TARIFAS[id] ?? 14_900;

// Cada compra da acceso a la minuta durante este tiempo, para corregirla y descargarla de nuevo.
export const DIAS_ACCESO_MINUTA = 30;

export const pesos = (v: number) => `$${v.toLocaleString("es-CO")}`;
