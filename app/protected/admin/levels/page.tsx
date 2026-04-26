import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getPMLevels } from "@/lib/actions/pm-levels";
import { LevelsManager } from "@/components/admin/levels-manager";

async function LevelsContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const levels = await getPMLevels();

  return <LevelsManager levels={levels} />;
}

export default function AdminLevelsPage() {
  return (
    <Suspense>
      <LevelsContent />
    </Suspense>
  );
}
