import "server-only";
import { createHash, randomUUID } from "node:crypto";

const IVA = 0.19;
// Valores antes de IVA, en pesos.
export const PRECIOS = {
  basico: { mensual: 49_900, anual: 499_000 },
  profesional: { mensual: 99_900, anual: 999_000 },
  firma: { mensual: 249_900, anual: 2_499_000 },
} as const;
export const PRECIO_CONCEPTO = 39_900;

export type Plan = keyof typeof PRECIOS;
export type Periodicidad = "mensual" | "anual";

/** Total en centavos con IVA y descuento aplicado. */
export function totalCentavos(base: number, descuentoPct = 0): number {
  return Math.round(base * (1 - descuentoPct / 100) * (1 + IVA)) * 100;
}

const sha256 = (s: string) => createHash("sha256").update(s).digest("hex");

export function nuevaReferencia(tipo: "SUS" | "CON" | "MIN"): string {
  return `${tipo}-${randomUUID()}`;
}

export function urlCheckout(p: { referencia: string; montoCentavos: number; email?: string; redirect: string }): string {
  const firma = sha256(`${p.referencia}${p.montoCentavos}COP${process.env.WOMPI_INTEGRITY_SECRET}`);
  const q = new URLSearchParams({
    "public-key": process.env.NEXT_PUBLIC_WOMPI_PUBLIC_KEY!,
    currency: "COP",
    "amount-in-cents": String(p.montoCentavos),
    reference: p.referencia,
    "signature:integrity": firma,
    "redirect-url": p.redirect,
  });
  if (p.email) q.set("customer-data:email", p.email);
  return `https://checkout.wompi.co/p/?${q}`;
}

export type EventoWompi = {
  event: string;
  data: { transaction: { id: string; status: string; reference: string; amount_in_cents: number } };
  signature: { properties: string[]; checksum: string };
  timestamp: number;
};

/** Verifica el checksum del evento según la documentación de Wompi. */
export function eventoValido(e: EventoWompi): boolean {
  const valores = e.signature.properties
    .map((ruta) => ruta.split(".").reduce<unknown>((o, k) => (o as Record<string, unknown>)?.[k], e.data))
    .join("");
  return sha256(`${valores}${e.timestamp}${process.env.WOMPI_EVENTS_SECRET}`) === e.signature.checksum.toLowerCase();
}

export const ESTADOS: Record<string, "aprobado" | "rechazado" | "anulado" | "error"> = {
  APPROVED: "aprobado",
  DECLINED: "rechazado",
  VOIDED: "anulado",
  ERROR: "error",
};
