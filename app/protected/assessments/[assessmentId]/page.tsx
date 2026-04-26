import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { getAssessmentById, deleteAssessment } from "@/lib/actions/assessments";
import { getProductManagers } from "@/lib/actions/product-managers";
import { getCriteria } from "@/lib/actions/criteria";
import { AssessmentForm } from "@/components/assessments/assessment-form";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

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

  const [productManagers, criteria] = await Promise.all([
    getProductManagers(),
    getCriteria(),
  ]);

  const pm = productManagers.find((p) => p.id === assessment.pm_id);

  async function handleDelete() {
    "use server";
    await deleteAssessment(assessmentId);
    redirect(`/protected/assessments?pmId=${assessment.pm_id}`);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <Link
        href={`/protected/assessments?pmId=${assessment.pm_id}`}
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
                {pm?.name} — {assessment.quarter}
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
        {assessment.status !== "completed" && (
          <form action={handleDelete}>
            <Button variant="destructive" size="sm" type="submit">
              Delete
            </Button>
          </form>
        )}
      </div>

      <AssessmentForm
        productManagers={productManagers}
        criteria={criteria}
        existingAssessment={assessment}
      />
    </div>
  );
}
