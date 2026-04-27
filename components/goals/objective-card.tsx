"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Trash2 } from "lucide-react";
import { deleteObjective } from "@/lib/actions/goals";
import type { ObjectiveWithKeyResults } from "@/lib/types/goals";
import { GOAL_STATUS_LABELS, formatScore, scoreColor } from "@/lib/types/goals";
import type { GoalStatus } from "@/lib/types/goals";
import { DIMENSION_LABELS } from "@/lib/types/assessments";
import type { Dimension } from "@/lib/types/assessments";

const STATUS_COLORS: Record<GoalStatus, string> = {
  not_started: "bg-muted text-muted-foreground",
  in_progress: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200",
  completed:
    "bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200",
};

export function ObjectiveCard({
  objective,
  onClick,
}: {
  objective: ObjectiveWithKeyResults;
  onClick?: () => void;
}) {
  const [deleting, setDeleting] = useState(false);

  async function handleDelete(e: React.MouseEvent) {
    e.stopPropagation();
    if (!confirm("Delete this objective and all its key results?")) return;
    setDeleting(true);
    try {
      await deleteObjective(objective.id);
    } finally {
      setDeleting(false);
    }
  }

  return (
    <Card
      className={onClick ? "cursor-pointer hover:border-foreground/20 transition-colors" : ""}
      onClick={onClick}
    >
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{objective.title}</CardTitle>
            <div className="flex items-center gap-2 flex-wrap">
              {objective.criterion && (
                <Badge variant="outline" className="text-xs">
                  {objective.criterion.name} ·{" "}
                  {DIMENSION_LABELS[objective.criterion.dimension as Dimension]}
                </Badge>
              )}
              <Badge className={`text-xs ${STATUS_COLORS[objective.status]}`}>
                {GOAL_STATUS_LABELS[objective.status]}
              </Badge>
            </div>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            {/* Score summary */}
            <div className="text-xs text-right space-y-0.5">
              <div>
                Mid:{" "}
                <span
                  className={
                    objective.mid_point_score !== null
                      ? `font-semibold ${scoreColor(objective.mid_point_score)}`
                      : "text-muted-foreground"
                  }
                >
                  {formatScore(objective.mid_point_score)}
                </span>
              </div>
              <div>
                Final:{" "}
                <span
                  className={
                    objective.final_score !== null
                      ? `font-semibold ${scoreColor(objective.final_score)}`
                      : "text-muted-foreground"
                  }
                >
                  {formatScore(objective.final_score)}
                </span>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={handleDelete}
              disabled={deleting}
            >
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {objective.key_results.length > 0 && (
        <CardContent>
          <ul className="space-y-1">
            {objective.key_results.map((kr) => (
              <li
                key={kr.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span
                  className={
                    objective.status === "completed"
                      ? "text-muted-foreground"
                      : ""
                  }
                >
                  {kr.title}
                </span>
                {(kr.mid_point_score !== null || kr.final_score !== null) && (
                  <span className="text-xs text-muted-foreground shrink-0">
                    {kr.mid_point_score !== null && (
                      <span className={scoreColor(kr.mid_point_score)}>
                        {formatScore(kr.mid_point_score)}
                      </span>
                    )}
                    {kr.mid_point_score !== null && kr.final_score !== null && " → "}
                    {kr.final_score !== null && (
                      <span className={scoreColor(kr.final_score)}>
                        {formatScore(kr.final_score)}
                      </span>
                    )}
                  </span>
                )}
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
