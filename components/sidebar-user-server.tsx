import { createClient } from "@/lib/supabase/server";
import { SidebarUser } from "@/components/sidebar-user";

export async function SidebarUserServer() {
  const supabase = await createClient();
  const { data } = await supabase.auth.getClaims();
  const email = data?.claims?.email as string | undefined;

  if (!email) return null;

  return <SidebarUser email={email} />;
}
