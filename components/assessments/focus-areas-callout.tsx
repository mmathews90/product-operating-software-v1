import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { GapBadge } from "./gap-badge";
import { DIMENSION_LABELS } from "@/lib/types/assessments";
import type { AssessmentWithScores } from "@/lib/types/assessments";
import { Target } from "lucide-react";

export function FocusAreasCallout({
  scores,
}: {
  scores: AssessmentWithScores["scores"];
}) {
  const gaps = scores
    .filter((s) => s.target_score > s.current_score)
    .map((s) => ({
      name: s.criterion.name,
      dimension: s.criterion.dimension,
      gap: s.target_score - s.current_score,
      target: s.target_score,
      current: s.current_score,
    }))
    .sort((a, b) => b.gap - a.gap);

  if (gaps.length === 0) return null;

  const cutoff = gaps[Math.min(2, gaps.length - 1)].gap;
  const focusAreas = gaps.filter((g) => g.gap >= cutoff);

  return (
    <Card className="border-amber-300 bg-amber-50 dark:border-amber-700 dark:bg-amber-950/30">
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          <Target className="h-4 w-4 text-amber-600 dark:text-amber-400" />
          Focus Areas
        </CardTitle>
      </CardHeader>
      <CardContent>
        <ul className="space-y-2">
          {focusAreas.map((area) => (
            <li key={area.name} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="font-medium text-sm">{area.name}</span>
                <span className="text-xs text-muted-foreground">
                  {DIMENSION_LABELS[area.dimension]}
                </span>
              </div>
              <GapBadge target={area.target} current={area.current} />
            </li>
          ))}
        </ul>
      </CardContent>
    </Card>
  );
}
