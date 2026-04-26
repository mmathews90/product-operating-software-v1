"use client";

import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ScoreInput } from "./score-input";
import {
  createAssessment,
  updateAssessment,
  completeAssessment,
} from "@/lib/actions/assessments";
import type {
  AssessmentCriterion,
  AssessmentWithScores,
  ProductManager,
  Dimension,
} from "@/lib/types/assessments";
import {
  DIMENSION_LABELS,
  getCurrentQuarter,
  getQuarterOptions,
} from "@/lib/types/assessments";

export function AssessmentForm({
  productManagers,
  criteria,
  existingAssessment,
  preselectedPmId,
  lastScores,
}: {
  productManagers: ProductManager[];
  criteria: AssessmentCriterion[];
  existingAssessment?: AssessmentWithScores;
  preselectedPmId?: string;
  lastScores?: Record<string, number>;
}) {
  const router = useRouter();
  const formRef = useRef<HTMLFormElement>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showCompleteDialog, setShowCompleteDialog] = useState(false);

  const isEditing = !!existingAssessment;
  const isCompleted = existingAssessment?.status === "completed";

  const criteriaByDimension = criteria.reduce(
    (acc, c) => {
      if (!acc[c.dimension]) acc[c.dimension] = [];
      acc[c.dimension].push(c);
      return acc;
    },
    {} as Record<Dimension, AssessmentCriterion[]>
  );

  const dimensions = Object.keys(DIMENSION_LABELS) as Dimension[];

  function getExistingScore(criterionId: string) {
    return existingAssessment?.scores.find(
      (s) => s.criterion_id === criterionId
    );
  }

  async function handleSave(formData: FormData) {
    setLoading(true);
    setError(null);
    try {
      if (isEditing) {
        formData.set("assessment_id", existingAssessment.id);
        await updateAssessment(formData);
      } else {
        await createAssessment(formData);
      }
      router.push(
        `/protected/assessments?pmId=${formData.get("pm_id") || existingAssessment?.pm_id}`
      );
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function handleComplete() {
    if (!formRef.current) return;
    setShowCompleteDialog(false);
    setLoading(true);
    setError(null);
    try {
      const formData = new FormData(formRef.current);
      if (isEditing) {
        formData.set("assessment_id", existingAssessment.id);
        await completeAssessment(formData);
      } else {
        const assessmentId = await createAssessment(formData);
        const completeData = new FormData(formRef.current);
        completeData.set("assessment_id", assessmentId);
        await completeAssessment(completeData);
      }
      router.push(
        `/protected/assessments?pmId=${formRef.current.querySelector<HTMLInputElement>('[name="pm_id"]')?.value || existingAssessment?.pm_id}`
      );
    } catch (e: any) {
      setError(e.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <form ref={formRef} action={handleSave} className="space-y-8">
        {error && (
          <div className="bg-destructive/10 text-destructive text-sm p-3 rounded-md">
            {error}
          </div>
        )}

        {!isEditing && (
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Product Manager</Label>
              <Select
                name="pm_id"
                defaultValue={preselectedPmId}
                required
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select PM" />
                </SelectTrigger>
                <SelectContent>
                  {productManagers.map((pm) => (
                    <SelectItem key={pm.id} value={pm.id}>
                      {pm.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Quarter</Label>
              <Select
                name="quarter"
                defaultValue={getCurrentQuarter()}
                required
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {getQuarterOptions().map((q) => (
                    <SelectItem key={q} value={q}>
                      {q}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        )}

        {dimensions.map((dim) => (
          <div key={dim} className="space-y-3">
            <h3 className="text-lg font-semibold border-b pb-2">
              {DIMENSION_LABELS[dim]}
              {criteriaByDimension[dim] && (
                <span className="ml-2 text-muted-foreground text-sm font-normal">
                  {criteriaByDimension[dim].length} criteria
                </span>
              )}
            </h3>
            {criteriaByDimension[dim]?.map((criterion) => {
              const existing = getExistingScore(criterion.id);
              return (
                <ScoreInput
                  key={criterion.id}
                  criterion={criterion}
                  defaultCurrent={existing?.current_score}
                  defaultNotes={existing?.notes ?? undefined}
                  lastScore={lastScores?.[criterion.id]}
                  disabled={isCompleted}
                />
              );
            })}
            {(!criteriaByDimension[dim] ||
              criteriaByDimension[dim].length === 0) && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No criteria defined for {DIMENSION_LABELS[dim]}.
              </p>
            )}
          </div>
        ))}

        <div className="space-y-2">
          <Label>Overall Notes</Label>
          <Textarea
            name="notes"
            placeholder="Overall assessment notes..."
            defaultValue={existingAssessment?.notes ?? ""}
            rows={3}
            disabled={isCompleted}
          />
        </div>

        {!isCompleted && (
          <div className="flex gap-3">
            <Button type="submit" variant="outline" disabled={loading}>
              {loading ? "Saving..." : "Save Draft"}
            </Button>
            <Button
              type="button"
              disabled={loading}
              onClick={() => setShowCompleteDialog(true)}
            >
              {loading ? "Saving..." : "Complete Assessment"}
            </Button>
            <Button
              type="button"
              variant="ghost"
              onClick={() => router.back()}
            >
              Cancel
            </Button>
          </div>
        )}

        {isCompleted && (
          <div className="flex gap-3">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.back()}
            >
              Back
            </Button>
          </div>
        )}
      </form>

      <Dialog open={showCompleteDialog} onOpenChange={setShowCompleteDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Complete Assessment</DialogTitle>
            <DialogDescription>
              Are you sure you want to complete this assessment? Completed
              assessments cannot be edited.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setShowCompleteDialog(false)}
            >
              Cancel
            </Button>
            <Button onClick={handleComplete}>
              Complete Assessment
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
