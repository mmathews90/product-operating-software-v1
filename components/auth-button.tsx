import Link from "next/link";
import { Button } from "./ui/button";
import { createClient } from "@/lib/supabase/server";
import { LogoutButton } from "./logout-button";

export async function AuthButton() {
  const supabase = await createClient();

  const { data } = await supabase.auth.getClaims();
  const user = data?.claims;

  if (!user) {
    return (
      <div className="flex gap-2">
        <Button asChild size="sm" variant={"outline"}>
          <Link href="/auth/login">Sign in</Link>
        </Button>
        <Button asChild size="sm" variant={"default"}>
          <Link href="/auth/sign-up">Sign up</Link>
        </Button>
      </div>
    );
  }

  // Try to get display name from profile
  const { data: profile } = await supabase
    .from("user_profiles")
    .select("display_name")
    .eq("id", user.sub)
    .single();

  const displayName = profile?.display_name ?? user.email;

  return (
    <div className="flex items-center gap-4">
      Hey, {displayName}!
      <LogoutButton />
    </div>
  );
}
