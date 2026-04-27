export type GoalStatus = "not_started" | "in_progress" | "completed";

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export type ScoringPhase = "mid_point" | "final";

export const SCORE_OPTIONS = [0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0];

export function formatScore(score: number | null): string {
  return score !== null ? score.toFixed(1) : "—";
}

export function scoreColor(score: number): string {
  if (score < 0.4) return "text-red-600 dark:text-red-400";
  if (score < 0.7) return "text-yellow-600 dark:text-yellow-400";
  return "text-green-600 dark:text-green-400";
}

export interface KeyResult {
  id: string;
  objective_id: string;
  title: string;
  status: GoalStatus;
  mid_point_score: number | null;
  final_score: number | null;
  sort_order: number;
  created_at: string;
  updated_at: string;
}

export interface Objective {
  id: string;
  user_id: string;
  assessment_id: string;
  pm_id: string;
  criterion_id: string | null;
  title: string;
  status: GoalStatus;
  mid_point_notes: string | null;
  final_notes: string | null;
  mid_point_score: number | null;
  final_score: number | null;
  created_at: string;
  updated_at: string;
}

export interface ObjectiveWithKeyResults extends Objective {
  key_results: KeyResult[];
  criterion?: { id: string; name: string; dimension: string } | null;
}

export interface DraftObjective {
  tempId: string;
  title: string;
  criterionId: string | null;
  keyResults: { tempId: string; title: string }[];
}
