import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCriteria } from "@/lib/actions/criteria";
import { CriteriaManager } from "@/components/assessments/criteria-manager";

async function CriteriaContent() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const criteria = await getCriteria();

  return <CriteriaManager criteria={criteria} />;
}

export default function AdminCriteriaPage() {
  return (
    <Suspense>
      <CriteriaContent />
    </Suspense>
  );
}
