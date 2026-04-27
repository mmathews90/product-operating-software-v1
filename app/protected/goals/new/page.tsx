import { Suspense } from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAssessmentById } from "@/lib/actions/assessments";
import { getProductManagers } from "@/lib/actions/product-managers";
import { getCriteria } from "@/lib/actions/criteria";
import { FocusAreasCallout } from "@/components/assessments/focus-areas-callout";
import { GoalForm } from "@/components/goals/goal-form";
import { formatCadenceLabel } from "@/lib/types/assessments";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NewGoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ assessmentId?: string }>;
}) {
  return (
    <Suspense>
      <NewGoalsGate searchParams={searchParams} />
    </Suspense>
  );
}

async function NewGoalsGate({
  searchParams,
}: {
  searchParams: Promise<{ assessmentId?: string }>;
}) {
  const { assessmentId } = await searchParams;

  if (!assessmentId) redirect("/protected/goals");

  return <NewGoalsContent assessmentId={assessmentId} />;
}

async function NewGoalsContent({ assessmentId }: { assessmentId: string }) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  let assessment: Awaited<ReturnType<typeof getAssessmentById>>;
  try {
    assessment = await getAssessmentById(assessmentId);
  } catch {
    redirect("/protected/goals");
  }

  if (assessment.status !== "completed") {
    redirect(`/protected/assessments/${assessmentId}`);
  }

  const [productManagers, criteria] = await Promise.all([
    getProductManagers(),
    getCriteria(),
  ]);

  const pm = productManagers.find((p) => p.id === assessment.pm_id);

  // Compute focus areas (same logic as FocusAreasCallout)
  const gaps = assessment.scores
    .filter((s) => s.target_score > s.current_score)
    .map((s) => ({
      criterionId: s.criterion.id,
      criterionName: s.criterion.name,
      dimension: s.criterion.dimension,
      gap: s.target_score - s.current_score,
    }))
    .sort((a, b) => b.gap - a.gap);

  let focusAreas: typeof gaps = [];
  if (gaps.length > 0) {
    const cutoff = gaps[Math.min(2, gaps.length - 1)].gap;
    focusAreas = gaps.filter((g) => g.gap >= cutoff);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <Link
        href={`/protected/assessments/${assessmentId}`}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to assessment
      </Link>

      <div>
        <h1 className="text-2xl font-bold">
          Set Goals — {pm?.name} — {formatCadenceLabel(assessment.cadence)}
        </h1>
        <p className="text-muted-foreground text-sm mt-1">
          Create objectives and key results based on assessment focus areas.
        </p>
      </div>

      <FocusAreasCallout scores={assessment.scores} />

      <GoalForm
        assessmentId={assessmentId}
        pmId={assessment.pm_id}
        focusAreas={focusAreas}
        criteria={criteria}
      />
    </div>
  );
}
