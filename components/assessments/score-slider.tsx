"use client";

import { useState } from "react";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { GapBadge } from "./gap-badge";
import type { AssessmentCriterion } from "@/lib/types/assessments";

export function ScoreSlider({
  criterion,
  defaultTarget,
  defaultCurrent,
  defaultNotes,
}: {
  criterion: AssessmentCriterion;
  defaultTarget?: number;
  defaultCurrent?: number;
  defaultNotes?: string;
}) {
  const [target, setTarget] = useState(defaultTarget ?? 7);
  const [current, setCurrent] = useState(defaultCurrent ?? 5);
  const [showNotes, setShowNotes] = useState(!!defaultNotes);

  return (
    <div className="space-y-3 p-4 rounded-lg border">
      <div className="flex items-start justify-between gap-2">
        <div>
          <h4 className="font-medium text-sm">{criterion.name}</h4>
          {criterion.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {criterion.description}
            </p>
          )}
        </div>
        <GapBadge target={target} current={current} />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs text-muted-foreground">Target</Label>
            <span className="text-xs font-mono font-medium">{target}</span>
          </div>
          <Slider
            value={[target]}
            onValueChange={([v]) => setTarget(v)}
            min={1}
            max={10}
            step={1}
            className="[&_[role=slider]]:bg-primary"
          />
          <input type="hidden" name={`target_${criterion.id}`} value={target} />
        </div>
        <div className="space-y-2">
          <div className="flex justify-between">
            <Label className="text-xs text-muted-foreground">Current</Label>
            <span className="text-xs font-mono font-medium">{current}</span>
          </div>
          <Slider
            value={[current]}
            onValueChange={([v]) => setCurrent(v)}
            min={1}
            max={10}
            step={1}
          />
          <input
            type="hidden"
            name={`current_${criterion.id}`}
            value={current}
          />
        </div>
      </div>

      <button
        type="button"
        onClick={() => setShowNotes(!showNotes)}
        className="text-xs text-muted-foreground hover:text-foreground"
      >
        {showNotes ? "Hide notes" : "Add notes"}
      </button>

      {showNotes && (
        <Textarea
          name={`notes_${criterion.id}`}
          placeholder="Optional notes for this criterion..."
          defaultValue={defaultNotes}
          className="text-sm"
          rows={2}
        />
      )}
    </div>
  );
}
