"use client";

import { useState } from "react";
import { ObjectiveCard } from "@/components/goals/objective-card";
import { ScoringSheet } from "@/components/goals/scoring-sheet";
import { formatCadenceLabel } from "@/lib/types/assessments";
import { Target } from "lucide-react";
import type { ObjectiveWithKeyResults } from "@/lib/types/goals";

type ObjectiveWithMeta = ObjectiveWithKeyResults & {
  pm_name: string;
  assessment_cadence: string;
};

export function GoalsList({
  objectives,
}: {
  objectives: ObjectiveWithMeta[];
}) {
  const [openObjectiveId, setOpenObjectiveId] = useState<string | null>(null);

  // Group by PM
  const grouped = new Map<
    string,
    { pmName: string; objectives: ObjectiveWithMeta[] }
  >();
  for (const obj of objectives) {
    if (!grouped.has(obj.pm_id)) {
      grouped.set(obj.pm_id, { pmName: obj.pm_name, objectives: [] });
    }
    grouped.get(obj.pm_id)!.objectives.push(obj);
  }

  const openObjective = objectives.find((o) => o.id === openObjectiveId) ?? null;

  function handleSaved() {
    if (!openObjective) return;
    // Find next unscored objective in the same PM group
    const pmGroup = grouped.get(openObjective.pm_id);
    if (!pmGroup) {
      setOpenObjectiveId(null);
      return;
    }
    const currentIdx = pmGroup.objectives.findIndex(
      (o) => o.id === openObjectiveId
    );
    const next = pmGroup.objectives.find(
      (o, i) => i > currentIdx && o.status !== "completed"
    );
    if (next) {
      setOpenObjectiveId(next.id);
    } else {
      setOpenObjectiveId(null);
    }
  }

  if (objectives.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-16 text-center">
        <Target className="h-12 w-12 text-muted-foreground mb-4" />
        <h3 className="font-semibold text-lg">No Goals Yet</h3>
        <p className="text-muted-foreground text-sm mt-1 max-w-md">
          Complete a skill assessment and set goals from the focus areas
          identified.
        </p>
      </div>
    );
  }

  return (
    <>
      {Array.from(grouped.entries()).map(([pmId, group]) => (
        <div key={pmId} className="space-y-3">
          <h2 className="text-lg font-semibold">{group.pmName}</h2>
          <div className="space-y-3">
            {group.objectives.map((obj) => (
              <div key={obj.id} className="space-y-1">
                <p className="text-xs text-muted-foreground">
                  {formatCadenceLabel(obj.assessment_cadence)}
                </p>
                <ObjectiveCard
                  objective={obj}
                  onClick={() => setOpenObjectiveId(obj.id)}
                />
              </div>
            ))}
          </div>
        </div>
      ))}

      {openObjective && (
        <ScoringSheet
          key={openObjective.id}
          objective={openObjective}
          open={!!openObjectiveId}
          onOpenChange={(open) => {
            if (!open) setOpenObjectiveId(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}
