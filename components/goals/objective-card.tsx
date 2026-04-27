"use client";

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2 } from "lucide-react";
import {
  updateObjective,
  deleteObjective,
  updateKeyResult,
} from "@/lib/actions/goals";
import type { ObjectiveWithKeyResults } from "@/lib/types/goals";
import { GOAL_STATUS_LABELS } from "@/lib/types/goals";
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
}: {
  objective: ObjectiveWithKeyResults;
}) {
  const [loading, setLoading] = useState(false);

  async function handleStatusChange(status: GoalStatus) {
    setLoading(true);
    try {
      await updateObjective({ id: objective.id, status });
    } finally {
      setLoading(false);
    }
  }

  async function handleKRStatusChange(krId: string, status: GoalStatus) {
    await updateKeyResult({ id: krId, status });
  }

  async function handleDelete() {
    if (!confirm("Delete this objective and all its key results?")) return;
    await deleteObjective(objective.id);
  }

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex items-start justify-between gap-2">
          <div className="space-y-1">
            <CardTitle className="text-base">{objective.title}</CardTitle>
            {objective.criterion && (
              <Badge variant="outline" className="text-xs">
                {objective.criterion.name} ·{" "}
                {DIMENSION_LABELS[objective.criterion.dimension as Dimension]}
              </Badge>
            )}
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <Select
              value={objective.status}
              onValueChange={(v) => handleStatusChange(v as GoalStatus)}
              disabled={loading}
            >
              <SelectTrigger className="h-7 text-xs w-[130px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(
                  Object.entries(GOAL_STATUS_LABELS) as [GoalStatus, string][]
                ).map(([key, label]) => (
                  <SelectItem key={key} value={key}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button variant="ghost" size="sm" onClick={handleDelete}>
              <Trash2 className="h-3 w-3 text-destructive" />
            </Button>
          </div>
        </div>
      </CardHeader>
      {objective.key_results.length > 0 && (
        <CardContent>
          <ul className="space-y-2">
            {objective.key_results.map((kr) => (
              <li
                key={kr.id}
                className="flex items-center justify-between gap-2 text-sm"
              >
                <span
                  className={
                    kr.status === "completed"
                      ? "line-through text-muted-foreground"
                      : ""
                  }
                >
                  {kr.title}
                </span>
                <Select
                  value={kr.status}
                  onValueChange={(v) =>
                    handleKRStatusChange(kr.id, v as GoalStatus)
                  }
                >
                  <SelectTrigger className="h-6 text-xs w-[120px] shrink-0">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(
                      Object.entries(GOAL_STATUS_LABELS) as [
                        GoalStatus,
                        string,
                      ][]
                    ).map(([key, label]) => (
                      <SelectItem key={key} value={key}>
                        {label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </li>
            ))}
          </ul>
        </CardContent>
      )}
    </Card>
  );
}
