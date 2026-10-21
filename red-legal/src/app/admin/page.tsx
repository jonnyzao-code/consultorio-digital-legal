import { exigirAdmin, pesosCentavos } from "@/lib/admin";
import { hoyMas } from "@/lib/terminos";
import { Tarjeta } from "./ui";

export default async function Resumen() {
  const { db } = await exigirAdmin();
  const hoy = hoyMas();
  const mes = `${hoy.slice(0, 7)}-01`;
  const [
    usuarios, abogados, solicitudes, vigentes, consultas, consultasMes, conceptos, casosActivos, vigilados, vencidos, pagosMes, minutasMes,
  ] = await Promise.all([
    db.from("perfiles").select("*", { count: "exact", head: true }),
    db.from("abogados").select("*", { count: "exact", head: true }).eq("activo", true),
    db.from("solicitudes_abogados").select("*", { count: "exact", head: true }).eq("estado", "pendiente"),
    db.from("suscripciones").select("abogado_id").gte("vigente_hasta", hoy),
    db.from("consultas").select("*", { count: "exact", head: true }),
    db.from("consultas").select("*", { count: "exact", head: true }).gte("creado_en", mes),
    db.from("consultas").select("*", { count: "exact", head: true }).eq("concepto_pagado", true),
    db.from("casos").select("*", { count: "exact", head: true }).neq("estado", "cerrado"),
    db.from("casos").select("*", { count: "exact", head: true }).neq("estado", "cerrado").eq("vigilar", true).not("radicado", "is", null),
    db.from("terminos").select("*", { count: "exact", head: true }).eq("cumplido", false).lt("vence", hoy),
    db.from("pagos").select("tipo, monto_centavos").eq("estado", "aprobado").gte("actualizado_en", mes),
    db.from("accesos_minutas").select("origen").gte("creado_en", mes),
  ]);
  const ingresos = (pagosMes.data ?? []).reduce((s, p) => s + Number(p.monto_centavos), 0);
  const porTipo = (t: string) => (pagosMes.data ?? []).filter((p) => p.tipo === t).reduce((s, p) => s + Number(p.monto_centavos), 0);
  const suscritos = new Set((vigentes.data ?? []).map((s) => s.abogado_id)).size;

  return (
    <div className="space-y-6">
      <section className="grid gap-3 sm:grid-cols-4">
        <Tarjeta titulo="Ingresos del mes" valor={pesosCentavos(ingresos)} nota="Pagos aprobados por Wompi" />
        <Tarjeta titulo="Suscripciones" valor={pesosCentavos(porTipo("suscripcion"))} />
        <Tarjeta titulo="Minutas" valor={pesosCentavos(porTipo("minuta"))} nota={`${(minutasMes.data ?? []).length} accesos este mes`} />
        <Tarjeta titulo="Conceptos" valor={pesosCentavos(porTipo("concepto"))} />
      </section>
      <section className="grid gap-3 sm:grid-cols-4">
        <Tarjeta titulo="Usuarios" valor={usuarios.count ?? 0} />
        <Tarjeta titulo="Abogados activos" valor={abogados.count ?? 0} nota={`${suscritos} con suscripción vigente`} />
        <Tarjeta titulo="Solicitudes pendientes" valor={solicitudes.count ?? 0} />
        <Tarjeta titulo="Orientaciones" valor={consultas.count ?? 0} nota={`${consultasMes.count ?? 0} este mes · ${conceptos.count ?? 0} conceptos pagados`} />
        <Tarjeta titulo="Casos activos" valor={casosActivos.count ?? 0} />
        <Tarjeta titulo="Procesos vigilados" valor={vigilados.count ?? 0} />
        <Tarjeta titulo="Términos vencidos" valor={vencidos.count ?? 0} nota="Sin marcar como cumplidos" />
      </section>
    </div>
  );
}
