import "server-only";
import { notFound, redirect } from "next/navigation";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { supabaseServer } from "@/lib/supabase/server";

/** Solo deja pasar al administrador. Devuelve el cliente con service role para leer todo el sitio. */
export async function exigirAdmin() {
  const { data } = await (await supabaseServer()).auth.getUser();
  if (!data.user) redirect("/ingresar?siguiente=/admin");
  const db = supabaseAdmin();
  const { data: perfil } = await db.from("perfiles").select("rol, suspendido").eq("id", data.user.id).single();
  if (perfil?.rol !== "admin" || perfil.suspendido) notFound();
  return { db, adminId: data.user.id };
}

export type Db = Awaited<ReturnType<typeof exigirAdmin>>["db"];

/** Correos de todos los usuarios (la tabla perfiles no los guarda). */
export async function correos(db: Db) {
  const mapa = new Map<string, { email: string; ultimo: string | null }>();
  for (let page = 1; page <= 20; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    for (const u of data?.users ?? []) mapa.set(u.id, { email: u.email ?? "", ultimo: u.last_sign_in_at ?? null });
    if (!data || data.users.length < 1000) break;
  }
  return mapa;
}

export const registrar = (db: Db, adminId: string, accion: string, objetivo: string, detalle?: object) =>
  db.from("bitacora_admin").insert({ admin_id: adminId, accion, objetivo, detalle });

export const fecha = (v: string | null | undefined) => (v ? new Date(v).toLocaleDateString("es-CO", { timeZone: "America/Bogota" }) : "–");
export const pesosCentavos = (c: number) => `$${Math.round(c / 100).toLocaleString("es-CO")}`;
