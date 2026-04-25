"use client";

import { useState } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ScoreSlider } from "./score-slider";
import { createAssessment, updateAssessment } from "@/lib/actions/assessments";
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
}: {
  productManagers: ProductManager[];
  criteria: AssessmentCriterion[];
  existingAssessment?: AssessmentWithScores;
  preselectedPmId?: string;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const isEditing = !!existingAssessment;

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

  async function handleSubmit(formData: FormData) {
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

  return (
    <form action={handleSubmit} className="space-y-6">
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

      <Tabs defaultValue={dimensions[0]}>
        <TabsList className="w-full">
          {dimensions.map((dim) => (
            <TabsTrigger key={dim} value={dim} className="flex-1">
              {DIMENSION_LABELS[dim]}
              {criteriaByDimension[dim] && (
                <span className="ml-1 text-muted-foreground text-xs">
                  ({criteriaByDimension[dim].length})
                </span>
              )}
            </TabsTrigger>
          ))}
        </TabsList>

        {dimensions.map((dim) => (
          <TabsContent key={dim} value={dim} className="space-y-3 mt-4">
            {criteriaByDimension[dim]?.map((criterion) => {
              const existing = getExistingScore(criterion.id);
              return (
                <ScoreSlider
                  key={criterion.id}
                  criterion={criterion}
                  defaultTarget={existing?.target_score}
                  defaultCurrent={existing?.current_score}
                  defaultNotes={existing?.notes ?? undefined}
                />
              );
            })}
            {(!criteriaByDimension[dim] ||
              criteriaByDimension[dim].length === 0) && (
              <p className="text-sm text-muted-foreground py-8 text-center">
                No criteria defined for {DIMENSION_LABELS[dim]}.
              </p>
            )}
          </TabsContent>
        ))}
      </Tabs>

      <div className="space-y-2">
        <Label>Overall Notes</Label>
        <Textarea
          name="notes"
          placeholder="Overall assessment notes..."
          defaultValue={existingAssessment?.notes ?? ""}
          rows={3}
        />
      </div>

      <div className="flex gap-3">
        <Button type="submit" disabled={loading}>
          {loading
            ? "Saving..."
            : isEditing
              ? "Update Assessment"
              : "Create Assessment"}
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
        >
          Cancel
        </Button>
      </div>
    </form>
  );
}
