export type GoalStatus = "not_started" | "in_progress" | "completed";

export const GOAL_STATUS_LABELS: Record<GoalStatus, string> = {
  not_started: "Not Started",
  in_progress: "In Progress",
  completed: "Completed",
};

export interface KeyResult {
  id: string;
  objective_id: string;
  title: string;
  status: GoalStatus;
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
