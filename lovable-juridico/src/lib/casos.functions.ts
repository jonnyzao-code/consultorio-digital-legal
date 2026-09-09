import { createServerFn } from "@tanstack/react-start";
import { requireSupabaseAuth } from "@/integrations/supabase/auth-middleware";

export type Proceso = {
  id: string;
  numero: string;
  demandante: string;
  demandado: string;
  clasificacion: string;
  notas: string;
  ultima_vista: string | null;
  ultima_actuacion: string | null;
  ultima_verificacion: string | null;
  vigente_hasta: string;
  created_at: string;
};

export type Perfil = {
  id: string;
  email: string | null;
  nombre_completo: string;
  tipo_documento: string;
  documento: string;
  telefono: string;
  ciudad: string;
  tarjeta_profesional: string;
  despacho: string;
  plan: "free" | "pago";
  esAdmin: boolean;
};

export const miPerfil = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Perfil | null> => {
    const { supabase, userId } = context;
    const { data } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .maybeSingle();
    const { data: rol } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId)
      .eq("role", "admin")
      .maybeSingle();
    if (!data) return null;
    return { ...(data as any), esAdmin: !!rol };
  });

export const actualizarPerfil = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: Partial<Perfil>) => input)
  .handler(async ({ data, context }) => {
    const { supabase, userId } = context;
    const campos = {
      nombre_completo: String(data.nombre_completo ?? ""),
      tipo_documento: String(data.tipo_documento ?? "CC"),
      documento: String(data.documento ?? ""),
      telefono: String(data.telefono ?? ""),
      ciudad: String(data.ciudad ?? ""),
      tarjeta_profesional: String(data.tarjeta_profesional ?? ""),
      despacho: String(data.despacho ?? ""),
    };
    const { error } = await supabase
      .from("profiles")
      .update(campos)
      .eq("id", userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const listarProcesos = createServerFn({ method: "GET" })
  .middleware([requireSupabaseAuth])
  .handler(async ({ context }): Promise<Proceso[]> => {
    const { supabase, userId } = context;
    const { data, error } = await supabase
      .from("procesos")
      .select("*")
      .eq("user_id", userId)
      .order("created_at", { ascending: false });
    if (error) throw new Error(error.message);
    return (data ?? []) as Proceso[];
  });

export type ResultadoCrearProceso = {
  creado: true;
  proceso: Proceso;
  /** true si el proceso quedó SIN cobertura y debe pagarse para activarlo. */
  requiere_pago: boolean;
  mensaje: string;
};

export const crearProceso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      numero: string;
      demandante: string;
      demandado: string;
      clasificacion: string;
      notas: string;
    }) => input,
  )
  .handler(async ({ data, context }): Promise<ResultadoCrearProceso> => {
    const { supabase, userId } = context;
    const { data: perfil } = await supabase
      .from("profiles")
      .select("plan")
      .eq("id", userId)
      .maybeSingle();

    // Regla de negocio de monetización:
    // - Plan pago activo → sin límite de procesos, 30 días de vigilancia c/u.
    // - Plan gratis → UN único proceso gratis por 1 día; cualquier proceso
    //   adicional se crea SIN cobertura y requiere pago por Wompi para activarse.
    const planPago = perfil?.plan === "pago";
    const { count } = await supabase
      .from("procesos")
      .select("*", { count: "exact", head: true })
      .eq("user_id", userId);
    const yaUsadoGratis = (count ?? 0) >= 1;

    let vigente: string;
    let requierePago = false;
    let mensaje: string;

    if (planPago) {
      vigente = new Date(Date.now() + 30 * 86400000).toISOString();
      mensaje = "Proceso registrado. Plan pago activo: 30 días de vigilancia.";
    } else if (!yaUsadoGratis) {
      vigente = new Date(Date.now() + 1 * 86400000).toISOString();
      mensaje =
        "Proceso registrado. Es tu ÚNICO proceso gratis (vigilancia por 1 día).";
    } else {
      vigente = new Date(0).toISOString(); // sin cobertura
      requierePago = true;
      mensaje =
        "Ya usaste tu proceso gratuito. Activa este proceso pagando $10.000 COP (30 días) con Wompi.";
    }

    const { data: fila, error } = await supabase
      .from("procesos")
      .insert({
        user_id: userId,
        numero: data.numero.trim(),
        demandante: data.demandante.trim(),
        demandado: data.demandado.trim(),
        clasificacion: data.clasificacion,
        notas: data.notas.trim(),
        vigente_hasta: vigente,
      })
      .select("*")
      .single();
    if (error) throw new Error(error.message);
    return {
      creado: true,
      proceso: fila as Proceso,
      requiere_pago: requierePago,
      mensaje,
    };
  });

export const eliminarProceso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator((input: { id: string }) => input)
  .handler(async ({ data, context }) => {
    const { error } = await context.supabase
      .from("procesos")
      .delete()
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });

export const marcarEstadoProceso = createServerFn({ method: "POST" })
  .middleware([requireSupabaseAuth])
  .inputValidator(
    (input: {
      id: string;
      ultima_vista?: string | null;
      ultima_actuacion?: string | null;
    }) => input,
  )
  .handler(async ({ data, context }) => {
    const patch: any = {
      ultima_verificacion: new Date().toISOString(),
    };
    if (data.ultima_vista !== undefined) patch['ultima_vista'] = data.ultima_vista;
    if (data.ultima_actuacion !== undefined)
      patch['ultima_actuacion'] = data.ultima_actuacion;
    const { error } = await context.supabase
      .from("procesos")
      .update(patch)
      .eq("id", data.id)
      .eq("user_id", context.userId);
    if (error) throw new Error(error.message);
    return { ok: true };
  });
