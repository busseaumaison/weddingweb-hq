import { createServerSupabase } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";

export async function getAdminContext() {
  const auth = await createServerSupabase();
  const { data: { user } } = await auth.auth.getUser();
  if (!user?.email) return null;
  const configured = (process.env.ADMIN_EMAILS || "").split(",").map(x => x.trim().toLowerCase()).filter(Boolean);
  if (configured.length && !configured.includes(user.email.toLowerCase())) return null;
  return { user, db: createAdminClient() };
}
