import { createClient } from "@/lib/supabase/server";
import { SidebarUser } from "@/components/sidebar-user";

export async function SidebarUserServer() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const userId = data?.claims?.sub as string | undefined;
  const email = data?.claims?.email as string | undefined;

  if (!email || !userId) return null;

  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name, role")
    .eq("id", userId)
    .single();

  return (
    <SidebarUser
      email={email}
      displayName={profile?.display_name ?? undefined}
      role={profile?.role ?? undefined}
    />
  );
}
