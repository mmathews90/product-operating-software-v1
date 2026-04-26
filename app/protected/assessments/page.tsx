import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProductManagers } from "@/lib/actions/product-managers";
import { getAssessmentsForPM } from "@/lib/actions/assessments";
import { seedDefaultCriteria } from "@/lib/actions/criteria";
import { PMSelector } from "@/components/assessments/pm-selector";
import { AssessmentList } from "@/components/assessments/assessment-list";
import { ClipboardList, Users } from "lucide-react";
import Link from "next/link";

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ pmId?: string }>;
}) {
  const { pmId } = await searchParams;

  // Ensure user is authenticated
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Seed default criteria on first visit
  await seedDefaultCriteria();

  const productManagers = await getProductManagers();
  const selectedPm = productManagers.find((pm) => pm.id === pmId);

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Skill Assessments</h1>
        <p className="text-muted-foreground text-sm mt-1">
          Track and assess PM skills across product knowledge, process
          knowledge, and people skills.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Suspense>
          <PMSelector productManagers={productManagers} />
        </Suspense>
      </div>

      {productManagers.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Product Managers Yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            Add your product managers in{" "}
            <Link href="/protected/admin/product-managers" className="underline hover:text-foreground">
              Admin &rarr; Product Managers
            </Link>{" "}
            to get started.
          </p>
        </div>
      ) : !selectedPm ? (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <ClipboardList className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">Select a Product Manager</h3>
          <p className="text-muted-foreground text-sm mt-1">
            Choose a PM from the dropdown to view their assessments.
          </p>
        </div>
      ) : (
        <AssessmentListSection pmId={selectedPm.id} pmName={selectedPm.name} />
      )}
    </div>
  );
}

async function AssessmentListSection({
  pmId,
  pmName,
}: {
  pmId: string;
  pmName: string;
}) {
  const assessments = await getAssessmentsForPM(pmId);
  return (
    <AssessmentList assessments={assessments} pmId={pmId} pmName={pmName} />
  );
}
