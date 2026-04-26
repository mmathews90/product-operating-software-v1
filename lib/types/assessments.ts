export type Dimension = "product_knowledge" | "process_knowledge" | "people_skills";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  product_knowledge: "Product Knowledge",
  process_knowledge: "Process Knowledge",
  people_skills: "People Skills",
};

export interface PMLevel {
  id: string;
  user_id: string;
  name: string;
  sort_order: number;
  created_at: string;
}

export interface ProductManager {
  id: string;
  user_id: string;
  name: string;
  role: string | null;
  level_id: string | null;
  avatar_url: string | null;
  created_at: string;
  level?: PMLevel | null;
}

export interface AssessmentCriterion {
  id: string;
  user_id: string;
  name: string;
  dimension: Dimension;
  description: string | null;
  sort_order: number;
  created_at: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  pm_id: string;
  quarter: string;
  status: "draft" | "completed";
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface AssessmentScore {
  id: string;
  assessment_id: string;
  criterion_id: string;
  target_score: number;
  current_score: number;
  notes: string | null;
}

export interface AssessmentWithScores extends Assessment {
  scores: (AssessmentScore & { criterion: AssessmentCriterion })[];
}

export interface DimensionTrendPoint {
  quarter: string;
  dimension: Dimension;
  avg_current: number;
  avg_target: number;
}

export function getCurrentQuarter(): string {
  const now = new Date();
  const q = Math.ceil((now.getMonth() + 1) / 3);
  return `${now.getFullYear()}-Q${q}`;
}

export function getQuarterOptions(): string[] {
  const now = new Date();
  const year = now.getFullYear();
  const options: string[] = [];
  for (let y = year - 1; y <= year + 1; y++) {
    for (let q = 1; q <= 4; q++) {
      options.push(`${y}-Q${q}`);
    }
  }
  return options;
}
