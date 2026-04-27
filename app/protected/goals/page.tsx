import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProductManagers } from "@/lib/actions/product-managers";
import { getAllObjectives } from "@/lib/actions/goals";
import { PMSelector } from "@/components/assessments/pm-selector";
import { GoalsList } from "@/components/goals/goals-list";

async function GoalsContent({
  searchParams,
}: {
  searchParams: Promise<{ pmId?: string }>;
}) {
  const { pmId } = await searchParams;

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const [productManagers, allObjectives] = await Promise.all([
    getProductManagers(),
    getAllObjectives(),
  ]);

  const objectives = pmId
    ? allObjectives.filter((o) => o.pm_id === pmId)
    : allObjectives;

  return (
    <>
      <div className="flex items-center gap-3">
        <Suspense>
          <PMSelector productManagers={productManagers} basePath="/protected/goals" />
        </Suspense>
      </div>

      <GoalsList objectives={objectives} />
    </>
  );
}

export default function GoalsPage({
  searchParams,
}: {
  searchParams: Promise<{ pmId?: string }>;
}) {
  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          OKR-based development goals linked to skill assessments.
        </p>
      </div>

      <Suspense>
        <GoalsContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
