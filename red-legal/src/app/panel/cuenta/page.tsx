import type { Metadata } from "next";
import Link from "next/link";
import { supabaseServer } from "@/lib/supabase/server";
import { FormularioClave } from "./formulario";

export const metadata: Metadata = { title: "Mi cuenta · Red Legal DOMINET" };

export default async function Cuenta() {
  const supabase = await supabaseServer();
  const { data: auth } = await supabase.auth.getUser();
  const { data: perfil } = await supabase.from("perfiles").select("nombre, rol").eq("id", auth.user!.id).single();
  return (
    <div className="mx-auto max-w-md space-y-6 rounded-2xl border bg-white p-8 shadow-xl shadow-slate-200/60">
      <div>
        <h1 className="text-3xl text-blue-900">Mi cuenta</h1>
        <p className="mt-1 text-sm text-slate-500">{perfil?.nombre} · {auth.user!.email} · {perfil?.rol}</p>
      </div>
      <section className="space-y-3">
        <h2 className="text-lg font-semibold">Contraseña de acceso</h2>
        <p className="text-sm text-slate-600">Crea o cambia tu contraseña para ingresar sin esperar el enlace al correo.</p>
        <FormularioClave />
      </section>
      <Link href={perfil?.rol === "admin" ? "/admin" : "/panel"} className="text-sm text-blue-900 underline">← Volver a mi panel</Link>
    </div>
  );
}
