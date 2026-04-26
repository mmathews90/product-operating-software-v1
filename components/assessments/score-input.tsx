"use client";

import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { GapBadge } from "./gap-badge";
import type { AssessmentCriterion } from "@/lib/types/assessments";
import { cn } from "@/lib/utils";

export function ScoreInput({
  criterion,
  defaultCurrent,
  defaultNotes,
  lastScore,
  disabled,
}: {
  criterion: AssessmentCriterion;
  defaultCurrent?: number;
  defaultNotes?: string;
  lastScore?: number;
  disabled?: boolean;
}) {
  const [current, setCurrent] = useState(defaultCurrent ?? 0);
  const [showNotes, setShowNotes] = useState(!!defaultNotes);
  const target = criterion.target_score;
  const hasScore = current > 0;

  return (
    <div
      className={cn(
        "space-y-3 p-4 rounded-lg border",
        disabled && "opacity-75"
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <h4 className="font-medium text-sm">{criterion.name}</h4>
          {criterion.description && (
            <p className="text-xs text-muted-foreground mt-0.5">
              {criterion.description}
            </p>
          )}
        </div>
        {hasScore && <GapBadge target={target} current={current} />}
      </div>

      <div className="flex items-center gap-4 text-xs text-muted-foreground">
        <span>
          Target: <span className="font-medium text-foreground">{target}</span>
        </span>
        {lastScore !== undefined && (
          <span>
            Last:{" "}
            <span className="font-medium text-foreground">{lastScore}</span>
          </span>
        )}
      </div>

      <div className="flex gap-1">
        {Array.from({ length: 10 }, (_, i) => i + 1).map((value) => (
          <button
            key={value}
            type="button"
            disabled={disabled}
            onClick={() => setCurrent(value)}
            className={cn(
              "flex-1 h-9 rounded-md text-sm font-medium transition-colors border",
              current === value
                ? "bg-primary text-primary-foreground border-primary"
                : "bg-background hover:bg-muted border-input",
              disabled && "pointer-events-none"
            )}
          >
            {value}
          </button>
        ))}
      </div>

      <input type="hidden" name={`current_${criterion.id}`} value={current} />

      {!disabled && (
        <button
          type="button"
          onClick={() => setShowNotes(!showNotes)}
          className="text-xs text-muted-foreground hover:text-foreground"
        >
          {showNotes ? "Hide notes" : "Add notes"}
        </button>
      )}

      {(showNotes || (disabled && defaultNotes)) && (
        <Textarea
          name={`notes_${criterion.id}`}
          placeholder="Optional notes for this criterion..."
          defaultValue={defaultNotes}
          className="text-sm"
          rows={2}
          disabled={disabled}
        />
      )}
    </div>
  );
}
