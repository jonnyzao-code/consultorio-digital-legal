import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export const VALOR_CENTAVOS = 1_000_000; // $10.000 COP
export const DIAS_VIGENCIA = 30;

async function sha256(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(texto),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

const esProduccion = (key: string) => key.startsWith("pub_prod_");

export type InicioPago =
  | { configurado: false; mensaje: string }
  | { configurado: true; url: string; referencia: string; esLinkDePago?: boolean };

export const iniciarPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { procesoId: string; origen: string }) => input)
  .handler(async ({ data, context }): Promise<InicioPago> => {
    const publicKey = process.env["WOMPI_PUBLIC_KEY"];
    const integrity = process.env["WOMPI_INTEGRITY_SECRET"];
    const paymentLink = process.env["WOMPI_PAYMENT_LINK"];

    if (!publicKey || !integrity) {
      if (paymentLink) {
        return {
          configurado: true,
          url: paymentLink,
          referencia: `LINK-${Date.now()}`,
          esLinkDePago: true,
        };
      }
      return {
        configurado: false,
        mensaje:
          "La pasarela de pagos Wompi aún no está configurada. Se necesitan la llave pública y el secreto de integridad del comercio, o un link de pago de Wompi.",
      };
    }
    const { supabase, userId } = context;
    const { data: proceso, error: e1 } = await supabase
      .from("procesos")
      .select("id")
      .eq("id", data.procesoId)
      .eq("user_id", userId)
      .maybeSingle();
    if (e1 || !proceso) throw new Error("Proceso no encontrado");

    const referencia = `PROC-${data.procesoId.slice(0, 8)}-${Date.now()}`;
    const { error } = await supabase.from("pagos").insert({
      user_id: userId,
      proceso_id: data.procesoId,
      referencia,
      monto_centavos: VALOR_CENTAVOS,
      estado: "PENDIENTE",
    });
    if (error) throw new Error(error.message);

    const firma = await sha256(
      `${referencia}${VALOR_CENTAVOS}COP${integrity}`,
    );
    const redirect = `${data.origen.replace(/\/$/, "")}/panel?pago=${encodeURIComponent(referencia)}`;

    // AWS CloudFront (WAF anti-SSRF) responde 403 Forbidden a los checkouts de
    // Wompi cuyo redirect-url apunta a localhost o a http://. En ese caso se
    // omite el redirect-url (el checkout carga OK) y la verificación se hace
    // manualmente al volver al panel con el botón "Verificar mi pago".
    const esLocal = (() => {
      try {
        const u = new URL(redirect);
        return (
          u.protocol === "http:" ||
          u.hostname === "localhost" ||
          u.hostname === "127.0.0.1"
        );
      } catch {
        return true;
      }
    })();

    // NOTA: Wompi exige el parámetro literal "signature:integrity" (con dos
    // puntos, sin codificar). URLSearchParams lo codificaría a "%3A" y el
    // checkout fallaría, así que se arma la URL manualmente.
    const params: string[] = [
      `public-key=${encodeURIComponent(publicKey)}`,
      "currency=COP",
      `amount-in-cents=${VALOR_CENTAVOS}`,
      `reference=${encodeURIComponent(referencia)}`,
      `signature:integrity=${firma}`,
    ];
    if (!esLocal) params.push(`redirect-url=${encodeURIComponent(redirect)}`);

    const url = `https://checkout.wompi.co/p/?${params.join("&")}`;
    return { configurado: true, url, referencia };
  });

export const confirmarPago = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { referencia: string; transaccionId?: string }) => input)
  .handler(async ({ data, context }) => {
    const publicKey = process.env["WOMPI_PUBLIC_KEY"] ?? "";
    const privateKey = process.env["WOMPI_PRIVATE_KEY"] ?? "";
    const { supabase, userId } = context;
    const { data: pago } = await supabase
      .from("pagos")
      .select("*")
      .eq("referencia", data.referencia)
      .eq("user_id", userId)
      .maybeSingle();
    if (!pago) return { estado: "NO_ENCONTRADO" as const };
    if (pago.estado === "APROBADO") return { estado: "APROBADO" as const };
    if (!publicKey) return { estado: pago.estado as string };

    const base = esProduccion(publicKey)
      ? "https://production.wompi.co/v1"
      : "https://sandbox.wompi.co/v1";

    // Localiza la transacción: por transactionId (retorno con redirect-url)
    // o por referencia usando la llave privada (cuando el redirect-url se
    // omitió por el bloqueo CloudFront en localhost).
    let tx: any = null;
    try {
      if (data.transaccionId) {
        const res = await fetch(`${base}/transactions/${data.transaccionId}`);
        tx = (await res.json())?.data;
      } else if (privateKey) {
        const res = await fetch(
          `${base}/transactions?reference=${encodeURIComponent(data.referencia)}`,
          {
            headers: { Authorization: `Bearer ${privateKey}` },
          },
        );
        const json: any = await res.json();
        const lista = Array.isArray(json?.data) ? json.data : [];
        tx = lista.find((t: any) => t.reference === data.referencia) ?? null;
      }
    } catch {
      return { estado: "PENDIENTE" as const };
    }
    if (!tx) return { estado: "PENDIENTE" as const };

    const estado =
      tx.status === "APPROVED" ? "APROBADO" : String(tx.status ?? "PENDIENTE");

    if (estado === "APROBADO") {
      const { supabaseAdmin } = await import(
        "@/integrations/supabase/client.server"
      );
      await supabaseAdmin
        .from("pagos")
        .update({
          estado: "APROBADO",
          transaccion_id: String(tx.id ?? data.transaccionId ?? ""),
          updated_at: new Date().toISOString(),
        })
        .eq("referencia", data.referencia);
      if (pago.proceso_id) {
        const hasta = new Date(
          Date.now() + DIAS_VIGENCIA * 86400000,
        ).toISOString();
        await supabaseAdmin
          .from("procesos")
          .update({ vigente_hasta: hasta })
          .eq("id", pago.proceso_id);
      }
    }
    return { estado };
  });
