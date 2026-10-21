import { exigirAdmin } from "@/lib/admin";
import { MINUTAS } from "@/lib/minutas";
import { pesos, precioMinuta } from "@/lib/minutas/precios";
import { Tabla } from "../ui";

export default async function MinutasAdmin() {
  const { db } = await exigirAdmin();
  const { data } = await db.from("accesos_minutas").select("minuta_id, origen");
  const conteo = (id: string, origen: string) => (data ?? []).filter((a) => a.minuta_id === id && a.origen === origen).length;
  const filas = MINUTAS.map((m) => ({ m, ventas: conteo(m.id, "pago"), plan: conteo(m.id, "plan") })).sort((a, b) => b.ventas + b.plan - (a.ventas + a.plan));

  return (
    <Tabla columnas={["Minuta", "Precio", "Ventas", "Ingresos", "Usos por plan"]}>
      {filas.map(({ m, ventas, plan }) => (
        <tr key={m.id}>
          <td className="p-2">{m.titulo}</td><td className="p-2">{pesos(precioMinuta(m.id))}</td>
          <td className="p-2">{ventas}</td><td className="p-2">{pesos(ventas * precioMinuta(m.id))}</td><td className="p-2">{plan}</td>
        </tr>
      ))}
    </Tabla>
  );
}
