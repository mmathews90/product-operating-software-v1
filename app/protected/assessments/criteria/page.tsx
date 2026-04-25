import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getCriteria } from "@/lib/actions/criteria";
import { CriteriaManager } from "@/components/assessments/criteria-manager";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default async function CriteriaPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const criteria = await getCriteria();

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <Link
        href="/protected/assessments"
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to assessments
      </Link>

      <div>
        <h1 className="text-2xl font-bold">Assessment Criteria</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Manage the criteria used to assess PM skills. These are organized by
          dimension and applied across all assessments.
        </p>
      </div>

      <CriteriaManager criteria={criteria} />
    </div>
  );
}
