import { createFileRoute } from "@tanstack/react-router";

async function sha256(texto: string): Promise<string> {
  const buf = await crypto.subtle.digest(
    "SHA-256",
    new TextEncoder().encode(texto),
  );
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export const Route = createFileRoute("/api/public/wompi")({
  server: {
    handlers: {
      POST: async ({ request }) => {
        const secret = process.env["WOMPI_EVENTS_SECRET"];
        if (!secret) return new Response("No configurado", { status: 503 });

        const body = (await request.json()) as any;
        const props: string[] = body?.signature?.properties ?? [];
        const timestamp = body?.timestamp;
        const cadena =
          props
            .map((ruta) =>
              String(
                ruta
                  .split(".")
                  .reduce((acc: any, k: string) => acc?.[k], body?.data) ?? "",
              ),
            )
            .join("") + `${timestamp}${secret}`;
        const esperado = await sha256(cadena);
        if (esperado !== body?.signature?.checksum) {
          return new Response("Firma inválida", { status: 401 });
        }

        const tx = body?.data?.transaction;
        if (tx?.status !== "APPROVED" || !tx?.reference) {
          return new Response("ok");
        }

        const { supabaseAdmin } = await import(
          "@/integrations/supabase/client.server"
        );
        const { data: pago } = await supabaseAdmin
          .from("pagos")
          .update({
            estado: "APROBADO",
            transaccion_id: String(tx.id ?? ""),
            updated_at: new Date().toISOString(),
          })
          .eq("referencia", tx.reference)
          .select("proceso_id")
          .maybeSingle();

        if (pago?.proceso_id) {
          await supabaseAdmin
            .from("procesos")
            .update({
              vigente_hasta: new Date(Date.now() + 30 * 86400000).toISOString(),
            })
            .eq("id", pago.proceso_id);
        }
        return new Response("ok");
      },
    },
  },
});
