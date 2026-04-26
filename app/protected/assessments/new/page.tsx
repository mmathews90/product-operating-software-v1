import { createClient } from "@/lib/supabase/server";
import { redirect } from "next/navigation";
import { getProductManagers } from "@/lib/actions/product-managers";
import { getCriteria } from "@/lib/actions/criteria";
import { getLastScoresForPM } from "@/lib/actions/assessments";
import { AssessmentForm } from "@/components/assessments/assessment-form";

export default async function NewAssessmentPage({
  searchParams,
}: {
  searchParams: Promise<{ pmId?: string }>;
}) {
  const { pmId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  const [productManagers, criteria] = await Promise.all([
    getProductManagers(),
    getCriteria(),
  ]);

  if (productManagers.length === 0) {
    redirect("/protected/assessments");
  }

  const lastScores = pmId ? await getLastScoresForPM(pmId) : {};

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">New Assessment</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Score each criterion from 1-10. Target scores and gap analysis are
          shown for reference.
        </p>
      </div>

      <AssessmentForm
        productManagers={productManagers}
        criteria={criteria}
        preselectedPmId={pmId}
        lastScores={lastScores}
      />
    </div>
  );
}
