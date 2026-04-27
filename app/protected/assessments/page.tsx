import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProductManagers } from "@/lib/actions/product-managers";
import { getAssessmentsPaginated } from "@/lib/actions/assessments";
import { PMSelector } from "@/components/assessments/pm-selector";
import { AssessmentTable } from "@/components/assessments/assessment-table";
import { Users } from "lucide-react";
import Link from "next/link";

export default async function AssessmentsPage({
  searchParams,
}: {
  searchParams: Promise<{ pmId?: string; page?: string }>;
}) {
  const { pmId, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const productManagers = await getProductManagers();

  if (productManagers.length === 0) {
    return (
      <div className="flex-1 w-full flex flex-col gap-6">
        <div>
          <h1 className="text-2xl font-bold">Skill Assessments</h1>
          <p className="text-muted-foreground text-sm mt-1">
            Track and assess PM skills across product knowledge, process
            knowledge, and people skills.
          </p>
        </div>
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Users className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Product Managers Yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            Add your product managers in{" "}
            <Link
              href="/protected/admin/product-managers"
              className="underline hover:text-foreground"
            >
              Admin &rarr; Product Managers
            </Link>{" "}
            to get started.
          </p>
        </div>
      </div>
    );
  }

  const { data: assessments, total } = await getAssessmentsPaginated({
    pmId,
    page,
  });

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

      <AssessmentTable
        assessments={assessments}
        total={total}
        page={page}
        pageSize={10}
        pmId={pmId}
      />
    </div>
  );
}
