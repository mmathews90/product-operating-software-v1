import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { getProductManagers } from "@/lib/actions/product-managers";
import { getAllObjectives } from "@/lib/actions/goals";
import { PMSelector } from "@/components/assessments/pm-selector";
import { ObjectiveCard } from "@/components/goals/objective-card";
import { formatCadenceLabel } from "@/lib/types/assessments";
import { Target } from "lucide-react";

export default async function GoalsPage({
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

  // Group by PM
  const grouped = new Map<
    string,
    { pmName: string; objectives: typeof objectives }
  >();
  for (const obj of objectives) {
    if (!grouped.has(obj.pm_id)) {
      grouped.set(obj.pm_id, { pmName: obj.pm_name, objectives: [] });
    }
    grouped.get(obj.pm_id)!.objectives.push(obj);
  }

  return (
    <div className="flex-1 w-full flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold">Goals</h1>
        <p className="text-muted-foreground text-sm mt-1">
          OKR-based development goals linked to skill assessments.
        </p>
      </div>

      <div className="flex items-center gap-3">
        <Suspense>
          <PMSelector productManagers={productManagers} basePath="/protected/goals" />
        </Suspense>
      </div>

      {objectives.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center">
          <Target className="h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="font-semibold text-lg">No Goals Yet</h3>
          <p className="text-muted-foreground text-sm mt-1 max-w-md">
            Complete a skill assessment and set goals from the focus areas
            identified.
          </p>
        </div>
      )}

      {Array.from(grouped.entries()).map(([pmIdKey, group]) => (
        <div key={pmIdKey} className="space-y-3">
          <h2 className="text-lg font-semibold">{group.pmName}</h2>
          <div className="space-y-3">
            {group.objectives.map((obj) => (
              <div key={obj.id} className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {formatCadenceLabel(obj.assessment_cadence)}
                </p>
                <ObjectiveCard objective={obj} />
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
