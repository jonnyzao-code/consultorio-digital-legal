import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { supabaseServer } from "@/lib/supabase/server";

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  if (code) await (await supabaseServer()).auth.exchangeCodeForSession(code);
  const jar = await cookies();
  const siguiente = jar.get("siguiente")?.value;
  jar.delete("siguiente");
  return NextResponse.redirect(new URL(siguiente && /^\/(?!\/)/.test(siguiente) ? siguiente : "/panel", url.origin));
}
