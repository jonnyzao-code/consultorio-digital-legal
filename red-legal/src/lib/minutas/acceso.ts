import "server-only";
import { plan as planDe } from "@/lib/planes";
import { hoyMas } from "@/lib/terminos";
import { supabaseServer } from "@/lib/supabase/server";

export type Acceso =
  | { tipo: "libre"; vence: string | null; admin?: boolean }
  | { tipo: "plan"; usados: number; limite: number | null }
  | { tipo: "comprar"; conSesion: boolean };

/** Decide si el usuario puede usar la minuta completa, si puede abrirla con su plan o si debe comprarla. */
export async function accesoMinuta(minutaId: string): Promise<Acceso> {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  if (!auth.user) return { tipo: "comprar", conSesion: false };
  const hoy = hoyMas();

  const [{ data: perfil }, { data: acceso }] = await Promise.all([
    supabase.from("perfiles").select("rol").eq("id", auth.user.id).single(),
    supabase.from("accesos_minutas").select("vence").eq("perfil_id", auth.user.id).eq("minuta_id", minutaId).gte("vence", hoy).order("vence", { ascending: false }).limit(1).maybeSingle(),
  ]);
  // El administrador ve todo sin pagar; los clientes y abogados sin plan siempre ven el precio.
  if (perfil?.rol === "admin") return { tipo: "libre", vence: null, admin: true };
  if (acceso) return { tipo: "libre", vence: acceso.vence };

  if (perfil?.rol === "abogado") {
    const { data: vigente } = await supabase.from("suscripciones").select("plan").gte("vigente_hasta", hoy).limit(1).maybeSingle();
    if (vigente) {
      const inicioMes = `${hoy.slice(0, 7)}-01`;
      const { count } = await supabase
        .from("accesos_minutas")
        .select("id", { count: "exact", head: true })
        .eq("perfil_id", auth.user.id)
        .eq("origen", "plan")
        .gte("creado_en", inicioMes);
      const limite = planDe(vigente.plan).minutasMes;
      if (limite === null || (count ?? 0) < limite) return { tipo: "plan", usados: count ?? 0, limite };
    }
  }
  return { tipo: "comprar", conSesion: true };
}
