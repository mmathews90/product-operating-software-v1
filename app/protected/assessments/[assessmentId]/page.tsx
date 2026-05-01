import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import {
  getAssessmentById,
  deleteAssessment,
  getLastScoresForPM,
} from "@/lib/actions/assessments";
import { getProductManagers } from "@/lib/actions/product-managers";
import { getCriteria } from "@/lib/actions/criteria";
import { AssessmentForm } from "@/components/assessments/assessment-form";
import { FocusAreasCallout } from "@/components/assessments/focus-areas-callout";
import { formatCadenceLabel } from "@/lib/types/assessments";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft, Target } from "lucide-react";

export default async function AssessmentDetailPage({
  params,
}: {
  params: Promise<{ assessmentId: string }>;
}) {
  const { assessmentId } = await params;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) redirect("/auth/login");

  let assessment: Awaited<ReturnType<typeof getAssessmentById>>;
  try {
    assessment = await getAssessmentById(assessmentId);
  } catch {
    redirect("/protected/assessments");
  }

  const [productManagers, criteria, lastScores] = await Promise.all([
    getProductManagers(),
    getCriteria(),
    assessment.pm_id
      ? getLastScoresForPM(assessment.pm_id, assessmentId)
      : Promise.resolve({} as Record<string, number>),
  ]);

  const pm = assessment.pm_id
    ? productManagers.find((p) => p.id === assessment.pm_id)
    : null;

  // Resolve subject name from PM record or user profile
  let subjectName = pm?.name ?? "";
  if (!subjectName && assessment.subject_user_id) {
    const { data: profile } = await supabase
      .from("user_profiles")
      .select("display_name")
      .eq("id", assessment.subject_user_id)
      .single();
    subjectName = profile?.display_name ?? "";
  }

  const backHref = assessment.pm_id
    ? `/protected/assessments?pmId=${assessment.pm_id}`
    : "/protected/assessments";

  async function handleDelete() {
    "use server";
    await deleteAssessment(assessmentId);
    redirect(backHref);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <Link
        href={backHref}
        className="flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground w-fit"
      >
        <ArrowLeft className="h-4 w-4" />
        Back to assessments
      </Link>

      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-bold">
                {subjectName} — {formatCadenceLabel(assessment.cadence)}
              </h1>
              <Badge
                variant={
                  assessment.status === "completed" ? "default" : "secondary"
                }
              >
                {assessment.status === "completed" ? "Completed" : "Draft"}
              </Badge>
            </div>
            <p className="text-muted-foreground text-sm mt-1">
              Created{" "}
              {new Date(assessment.created_at).toLocaleDateString()}
              {assessment.updated_at !== assessment.created_at && (
                <span>
                  {" "}
                  · Updated{" "}
                  {new Date(assessment.updated_at).toLocaleDateString()}
                </span>
              )}
            </p>
          </div>
        </div>
        {assessment.status === "completed" && (
          <Link href={`/protected/goals/new?assessmentId=${assessmentId}`}>
            <Button size="sm">
              <Target className="h-4 w-4 mr-1" />
              Set Goals
            </Button>
          </Link>
        )}
        {assessment.status !== "completed" && (
          <form action={handleDelete}>
            <Button variant="destructive" size="sm" type="submit">
              Delete
            </Button>
          </form>
        )}
      </div>

      {assessment.status === "completed" && (
        <FocusAreasCallout scores={assessment.scores} />
      )}

      <AssessmentForm
        productManagers={productManagers}
        criteria={criteria}
        existingAssessment={assessment}
        lastScores={lastScores}
      />

      {assessment.status === "completed" && (
        <div className="flex gap-3">
          <Link href={`/protected/goals/new?assessmentId=${assessmentId}`}>
            <Button>
              <Target className="h-4 w-4 mr-1" />
              Set Goals
            </Button>
          </Link>
          <Link href={backHref}>
            <Button variant="outline">Back</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
