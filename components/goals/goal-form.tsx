"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Trash2, X } from "lucide-react";
import { createBulkObjectives } from "@/lib/actions/goals";
import type { AssessmentCriterion } from "@/lib/types/assessments";
import { DIMENSION_LABELS } from "@/lib/types/assessments";
import type { Dimension } from "@/lib/types/assessments";
import type { DraftObjective } from "@/lib/types/goals";

interface FocusArea {
  criterionId: string;
  criterionName: string;
  dimension: string;
  gap: number;
}

function makeDraft(
  criterionId: string | null = null,
  title: string = ""
): DraftObjective {
  return {
    tempId: crypto.randomUUID(),
    title,
    criterionId,
    keyResults: [{ tempId: crypto.randomUUID(), title: "" }],
  };
}

export function GoalForm({
  assessmentId,
  pmId,
  subjectUserId,
  focusAreas,
  criteria,
}: {
  assessmentId: string;
  pmId?: string;
  subjectUserId?: string;
  focusAreas: FocusArea[];
  criteria: AssessmentCriterion[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const initialDrafts =
    focusAreas.length > 0
      ? focusAreas.map((fa) =>
          makeDraft(fa.criterionId, `Improve ${fa.criterionName.toLowerCase()}`)
        )
      : [makeDraft()];

  const [objectives, setObjectives] = useState<DraftObjective[]>(initialDrafts);

  function addObjective() {
    setObjectives((prev) => [...prev, makeDraft()]);
  }

  function removeObjective(tempId: string) {
    setObjectives((prev) => prev.filter((o) => o.tempId !== tempId));
  }

  function updateObjectiveTitle(tempId: string, title: string) {
    setObjectives((prev) =>
      prev.map((o) => (o.tempId === tempId ? { ...o, title } : o))
    );
  }

  function updateObjectiveCriterion(
    tempId: string,
    criterionId: string | null
  ) {
    setObjectives((prev) =>
      prev.map((o) => (o.tempId === tempId ? { ...o, criterionId } : o))
    );
  }

  function addKeyResult(objectiveTempId: string) {
    setObjectives((prev) =>
      prev.map((o) =>
        o.tempId === objectiveTempId
          ? {
              ...o,
              keyResults: [
                ...o.keyResults,
                { tempId: crypto.randomUUID(), title: "" },
              ],
            }
          : o
      )
    );
  }

  function removeKeyResult(objectiveTempId: string, krTempId: string) {
    setObjectives((prev) =>
      prev.map((o) =>
        o.tempId === objectiveTempId
          ? {
              ...o,
              keyResults: o.keyResults.filter((kr) => kr.tempId !== krTempId),
            }
          : o
      )
    );
  }

  function updateKeyResultTitle(
    objectiveTempId: string,
    krTempId: string,
    title: string
  ) {
    setObjectives((prev) =>
      prev.map((o) =>
        o.tempId === objectiveTempId
          ? {
              ...o,
              keyResults: o.keyResults.map((kr) =>
                kr.tempId === krTempId ? { ...kr, title } : kr
              ),
            }
          : o
      )
    );
  }

  async function handleSubmit() {
    setError(null);

    const valid = objectives.filter((o) => o.title.trim());
    if (valid.length === 0) {
      setError("Add at least one objective with a title.");
      return;
    }

    for (const obj of valid) {
      const validKRs = obj.keyResults.filter((kr) => kr.title.trim());
      if (validKRs.length === 0) {
        setError(`Objective "${obj.title}" needs at least one key result.`);
        return;
      }
    }

    setLoading(true);
    try {
      await createBulkObjectives({
        assessmentId,
        pmId,
        subjectUserId,
        objectives: valid.map((o) => ({
          title: o.title.trim(),
          criterionId: o.criterionId,
          keyResults: o.keyResults
            .filter((kr) => kr.title.trim())
            .map((kr) => ({ title: kr.title.trim() })),
        })),
      });
      router.push("/protected/goals");
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  // Sort criteria so focus area criteria appear first
  const focusAreaIds = new Set(focusAreas.map((fa) => fa.criterionId));
  const sortedCriteria = [...criteria].sort((a, b) => {
    const aFocus = focusAreaIds.has(a.id) ? 0 : 1;
    const bFocus = focusAreaIds.has(b.id) ? 0 : 1;
    return aFocus - bFocus;
  });

  return (
    <div className="space-y-6">
      {error && (
        <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
          {error}
        </div>
      )}

      {objectives.map((obj, idx) => (
        <Card key={obj.tempId}>
          <CardHeader className="pb-3">
            <div className="flex items-center justify-between">
              <CardTitle className="text-sm text-muted-foreground">
                Objective {idx + 1}
              </CardTitle>
              {objectives.length > 1 && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => removeObjective(obj.tempId)}
                >
                  <Trash2 className="h-3 w-3 text-destructive" />
                </Button>
              )}
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Objective Title</Label>
              <Input
                placeholder="e.g., Improve product discovery skills"
                value={obj.title}
                onChange={(e) =>
                  updateObjectiveTitle(obj.tempId, e.target.value)
                }
              />
            </div>

            <div className="space-y-2">
              <Label>Linked Criterion (optional)</Label>
              <Select
                value={obj.criterionId ?? "none"}
                onValueChange={(v) =>
                  updateObjectiveCriterion(
                    obj.tempId,
                    v === "none" ? null : v
                  )
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select criterion" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  {sortedCriteria.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                      {focusAreaIds.has(c.id) ? " (focus area)" : ""} ·{" "}
                      {DIMENSION_LABELS[c.dimension as Dimension]}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Key Results</Label>
              <div className="space-y-2">
                {obj.keyResults.map((kr, krIdx) => (
                  <div key={kr.tempId} className="flex gap-2">
                    <Input
                      placeholder={`Key result ${krIdx + 1}`}
                      value={kr.title}
                      onChange={(e) =>
                        updateKeyResultTitle(
                          obj.tempId,
                          kr.tempId,
                          e.target.value
                        )
                      }
                    />
                    {obj.keyResults.length > 1 && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeKeyResult(obj.tempId, kr.tempId)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    )}
                  </div>
                ))}
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => addKeyResult(obj.tempId)}
              >
                <Plus className="h-3 w-3 mr-1" />
                Add Key Result
              </Button>
            </div>
          </CardContent>
        </Card>
      ))}

      <Button type="button" variant="outline" onClick={addObjective}>
        <Plus className="h-4 w-4 mr-1" />
        Add Objective
      </Button>

      <div className="flex gap-3 pt-2">
        <Button onClick={handleSubmit} disabled={loading}>
          {loading ? "Saving..." : "Save Goals"}
        </Button>
        <Button
          type="button"
          variant="ghost"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </div>
  );
}
