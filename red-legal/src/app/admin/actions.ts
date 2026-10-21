"use server";

import { headers } from "next/headers";
import { revalidatePath } from "next/cache";
import { z } from "zod";
import { exigirAdmin, registrar } from "@/lib/admin";

const Rol = z.enum(["cliente", "abogado", "admin"]);
const Plan = z.enum(["basico", "profesional", "firma"]);

export async function cambiarRol(perfilId: string, form: FormData) {
  const { db, adminId } = await exigirAdmin();
  const rol = Rol.parse(form.get("rol"));
  if (perfilId === adminId && rol !== "admin") throw new Error("No puedes quitarte tu propio rol de administrador.");
  await db.from("perfiles").update({ rol }).eq("id", perfilId);
  await registrar(db, adminId, "cambiar_rol", perfilId, { rol });
  revalidatePath("/admin/cuentas");
}

export async function suspender(perfilId: string, suspendido: boolean) {
  const { db, adminId } = await exigirAdmin();
  if (perfilId === adminId) throw new Error("No puedes suspender tu propia cuenta.");
  // La suspensión bloquea el inicio de sesión y oculta al abogado del directorio.
  await db.auth.admin.updateUserById(perfilId, { ban_duration: suspendido ? "876000h" : "none" });
  await db.from("perfiles").update({ suspendido }).eq("id", perfilId);
  if (suspendido) await db.from("abogados").update({ activo: false }).eq("id", perfilId);
  await registrar(db, adminId, suspendido ? "suspender" : "reactivar", perfilId);
  revalidatePath("/admin/cuentas");
}

export async function aprobarSolicitud(solicitudId: string) {
  const { db, adminId } = await exigirAdmin();
  const { data: s } = await db.from("solicitudes_abogados").select("*").eq("id", solicitudId).single();
  if (!s || s.estado !== "pendiente") return;

  // Si el abogado aún no tiene cuenta, se le invita por correo; el enlace lo lleva a su panel.
  let usuarioId: string | undefined;
  for (let page = 1; page <= 20 && !usuarioId; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 1000 });
    usuarioId = data?.users.find((u) => u.email?.toLowerCase() === s.email.toLowerCase())?.id;
    if (!data || data.users.length < 1000) break;
  }
  if (!usuarioId) {
    const origen = (await headers()).get("origin");
    const { data, error } = await db.auth.admin.inviteUserByEmail(s.email, { redirectTo: `${origen}/auth/callback`, data: { nombre: s.nombre } });
    if (error) throw new Error(`No se pudo invitar al abogado: ${error.message}`);
    usuarioId = data.user.id;
  }

  await db.from("perfiles").upsert({ id: usuarioId, nombre: s.nombre, telefono: s.telefono, rol: "abogado" });
  await db.from("abogados").upsert({
    id: usuarioId, tarjeta_profesional: s.tarjeta_profesional, ciudad: s.ciudad, areas: s.areas, plan: s.plan, activo: true, verificado_en: new Date().toISOString(),
  });
  await db.from("solicitudes_abogados").update({ estado: "aprobada", verificado_sirna_en: new Date().toISOString() }).eq("id", solicitudId);
  await registrar(db, adminId, "aprobar_abogado", usuarioId, { solicitud: solicitudId, tarjeta: s.tarjeta_profesional });
  revalidatePath("/admin/solicitudes");
}

export async function rechazarSolicitud(solicitudId: string) {
  const { db, adminId } = await exigirAdmin();
  await db.from("solicitudes_abogados").update({ estado: "rechazada" }).eq("id", solicitudId).eq("estado", "pendiente");
  await registrar(db, adminId, "rechazar_solicitud", solicitudId);
  revalidatePath("/admin/solicitudes");
}

export async function actualizarAbogado(abogadoId: string, form: FormData) {
  const { db, adminId } = await exigirAdmin();
  const datos = z.object({ plan: Plan, activo: z.enum(["si", "no"]) }).parse(Object.fromEntries(form));
  await db.from("abogados").update({ plan: datos.plan, activo: datos.activo === "si" }).eq("id", abogadoId);
  await registrar(db, adminId, "actualizar_abogado", abogadoId, datos);
  revalidatePath(`/admin/abogados/${abogadoId}`);
}

export async function otorgarSuscripcion(abogadoId: string, form: FormData) {
  const { db, adminId } = await exigirAdmin();
  const datos = z.object({ plan: Plan, hasta: z.iso.date() }).parse(Object.fromEntries(form));
  // Cortesías y pagos por fuera de Wompi (transferencia, convenio).
  await db.from("suscripciones").insert({
    abogado_id: abogadoId, plan: datos.plan, periodicidad: "mensual", valor_cop: 0, descuento_pct: 100, vigente_hasta: datos.hasta, referencia_pasarela: "manual-admin",
  });
  await db.from("abogados").update({ plan: datos.plan }).eq("id", abogadoId);
  await registrar(db, adminId, "otorgar_suscripcion", abogadoId, datos);
  revalidatePath(`/admin/abogados/${abogadoId}`);
}
