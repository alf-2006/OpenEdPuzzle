import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";

/**
 * /app index — role router. Middleware normally redirects before this
 * renders; this is the defense-in-depth fallback (e.g. middleware disabled
 * in a self-hosted deploy). Role is read from the RLS-protected profiles
 * table, never from user_metadata.
 */
export default async function AppIndexPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/app/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();

  redirect(
    profile?.role === "teacher" ? "/app/teacher/classes" : "/app/student/classes",
  );
}
