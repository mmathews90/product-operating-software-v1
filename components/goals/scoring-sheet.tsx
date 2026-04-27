"use client";

import { useState, useTransition, useMemo } from "react";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetDescription,
  SheetFooter,
} from "@/components/ui/sheet";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { scoreObjective } from "@/lib/actions/goals";
import type { ObjectiveWithKeyResults } from "@/lib/types/goals";
import type { ScoringPhase } from "@/lib/types/goals";
import {
  SCORE_OPTIONS,
  formatScore,
  scoreColor,
  GOAL_STATUS_LABELS,
} from "@/lib/types/goals";
import { DIMENSION_LABELS } from "@/lib/types/assessments";
import type { Dimension } from "@/lib/types/assessments";

function getPhase(objective: ObjectiveWithKeyResults): ScoringPhase | "view" {
  if (objective.status === "completed") return "view";
  if (objective.status === "in_progress") return "final";
  return "mid_point";
}

const PHASE_LABELS: Record<ScoringPhase | "view", string> = {
  mid_point: "Mid-Point Scoring",
  final: "Final Scoring",
  view: "Completed",
};

export function ScoringSheet({
  objective,
  open,
  onOpenChange,
  onSaved,
}: {
  objective: ObjectiveWithKeyResults;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}) {
  const phase = getPhase(objective);
  const isReadOnly = phase === "view";
  const scoringPhase: ScoringPhase = phase === "view" ? "final" : phase;

  const [krScores, setKrScores] = useState<Record<string, number | null>>(() => {
    const initial: Record<string, number | null> = {};
    for (const kr of objective.key_results) {
      initial[kr.id] =
        scoringPhase === "mid_point" ? kr.mid_point_score : kr.final_score;
    }
    return initial;
  });

  const [notes, setNotes] = useState(() =>
    scoringPhase === "mid_point"
      ? objective.mid_point_notes ?? ""
      : objective.final_notes ?? ""
  );

  const [isPending, startTransition] = useTransition();

  const avgScore = useMemo(() => {
    const scored = Object.values(krScores).filter(
      (s): s is number => s !== null
    );
    if (scored.length === 0) return null;
    return (
      Math.round((scored.reduce((a, b) => a + b, 0) / scored.length) * 10) / 10
    );
  }, [krScores]);

  const allScored = objective.key_results.every(
    (kr) => krScores[kr.id] !== null && krScores[kr.id] !== undefined
  );

  function handleScoreChange(krId: string, value: string) {
    setKrScores((prev) => ({ ...prev, [krId]: parseFloat(value) }));
  }

  function handleSave() {
    if (!allScored) return;
    startTransition(async () => {
      await scoreObjective({
        objectiveId: objective.id,
        phase: scoringPhase,
        krScores: objective.key_results.map((kr) => ({
          id: kr.id,
          score: krScores[kr.id]!,
        })),
        notes,
      });
      onSaved?.();
    });
  }

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent
        side="right"
        className="sm:max-w-lg w-full flex flex-col"
      >
        <SheetHeader>
          <div className="flex items-center gap-2 flex-wrap">
            <Badge variant="outline" className="text-xs">
              {PHASE_LABELS[phase]}
            </Badge>
            <Badge variant="secondary" className="text-xs">
              {GOAL_STATUS_LABELS[objective.status]}
            </Badge>
          </div>
          <SheetTitle>{objective.title}</SheetTitle>
          {objective.criterion && (
            <SheetDescription>
              {objective.criterion.name} ·{" "}
              {DIMENSION_LABELS[objective.criterion.dimension as Dimension]}
            </SheetDescription>
          )}
        </SheetHeader>

        <div className="flex-1 overflow-y-auto px-4 space-y-6">
          {/* Mid-point reference when doing final scoring */}
          {phase === "final" && objective.mid_point_score !== null && (
            <div className="rounded-md border p-3 space-y-1 bg-muted/50">
              <p className="text-xs font-medium text-muted-foreground">
                Mid-Point Reference
              </p>
              <p className="text-sm">
                Score:{" "}
                <span className={scoreColor(objective.mid_point_score)}>
                  {formatScore(objective.mid_point_score)}
                </span>
              </p>
              {objective.mid_point_notes && (
                <p className="text-sm text-muted-foreground">
                  {objective.mid_point_notes}
                </p>
              )}
            </div>
          )}

          {/* Completed view: show both phases */}
          {phase === "view" && (
            <div className="space-y-3">
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Mid-Point
                </p>
                <p className="text-sm">
                  Score:{" "}
                  <span
                    className={
                      objective.mid_point_score !== null
                        ? scoreColor(objective.mid_point_score)
                        : ""
                    }
                  >
                    {formatScore(objective.mid_point_score)}
                  </span>
                </p>
                {objective.mid_point_notes && (
                  <p className="text-sm text-muted-foreground">
                    {objective.mid_point_notes}
                  </p>
                )}
              </div>
              <div className="rounded-md border p-3 space-y-1">
                <p className="text-xs font-medium text-muted-foreground">
                  Final
                </p>
                <p className="text-sm">
                  Score:{" "}
                  <span
                    className={
                      objective.final_score !== null
                        ? scoreColor(objective.final_score)
                        : ""
                    }
                  >
                    {formatScore(objective.final_score)}
                  </span>
                </p>
                {objective.final_notes && (
                  <p className="text-sm text-muted-foreground">
                    {objective.final_notes}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* KR scoring */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">Key Results</Label>
              {avgScore !== null && (
                <span className={`text-sm font-semibold ${scoreColor(avgScore)}`}>
                  Avg: {formatScore(avgScore)}
                </span>
              )}
            </div>
            {objective.key_results.map((kr) => (
              <div key={kr.id} className="space-y-1">
                <p className="text-sm">{kr.title}</p>
                {isReadOnly ? (
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span>
                      Mid:{" "}
                      <span
                        className={
                          kr.mid_point_score !== null
                            ? scoreColor(kr.mid_point_score)
                            : ""
                        }
                      >
                        {formatScore(kr.mid_point_score)}
                      </span>
                    </span>
                    <span>
                      Final:{" "}
                      <span
                        className={
                          kr.final_score !== null
                            ? scoreColor(kr.final_score)
                            : ""
                        }
                      >
                        {formatScore(kr.final_score)}
                      </span>
                    </span>
                  </div>
                ) : (
                  <div className="flex items-center gap-3">
                    <Select
                      value={
                        krScores[kr.id] !== null && krScores[kr.id] !== undefined
                          ? String(krScores[kr.id])
                          : ""
                      }
                      onValueChange={(v) => handleScoreChange(kr.id, v)}
                    >
                      <SelectTrigger className="h-8 w-[100px] text-sm">
                        <SelectValue placeholder="Score" />
                      </SelectTrigger>
                      <SelectContent>
                        {SCORE_OPTIONS.map((s) => (
                          <SelectItem key={s} value={String(s)}>
                            {s.toFixed(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    {phase === "final" && kr.mid_point_score !== null && (
                      <span className="text-xs text-muted-foreground">
                        Mid: {formatScore(kr.mid_point_score)}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {/* Notes */}
          {!isReadOnly && (
            <div className="space-y-2">
              <Label className="text-sm font-medium">
                {scoringPhase === "mid_point" ? "Mid-Point Notes" : "Final Notes"}
              </Label>
              <Textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Add notes for this objective..."
                rows={3}
              />
            </div>
          )}
        </div>

        {!isReadOnly && (
          <SheetFooter>
            <Button
              onClick={handleSave}
              disabled={!allScored || isPending}
              className="w-full"
            >
              {isPending
                ? "Saving..."
                : scoringPhase === "mid_point"
                  ? "Save Mid-Point Scores"
                  : "Complete Goal"}
            </Button>
          </SheetFooter>
        )}
      </SheetContent>
    </Sheet>
  );
}
