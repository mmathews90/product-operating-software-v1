export type Dimension = "product_knowledge" | "process_knowledge" | "people_skills";

export const DIMENSION_LABELS: Record<Dimension, string> = {
  product_knowledge: "Product Knowledge",
  process_knowledge: "Process Knowledge",
  people_skills: "People Skills",
};

export type Rhythm = "adhoc" | "monthly" | "quarterly";

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
  target_score: number;
  created_at: string;
}

export interface Assessment {
  id: string;
  user_id: string;
  pm_id: string;
  cadence: string;
  status: "draft" | "completed";
  notes: string | null;
  auto_created?: boolean;
  notified_at?: string | null;
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
  cadence: string;
  dimension: Dimension;
  avg_current: number;
  avg_target: number;
}

export interface UserSettings {
  id: string;
  user_id: string;
  rhythm: Rhythm;
  notification_email: string | null;
  created_at: string;
  updated_at: string;
}

export function getCurrentCadence(rhythm: Rhythm): string {
  const now = new Date();
  if (rhythm === "quarterly") {
    const q = Math.ceil((now.getMonth() + 1) / 3);
    return `${now.getFullYear()}-Q${q}`;
  }
  if (rhythm === "monthly") {
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  }
  // adhoc
  return now.toISOString().slice(0, 10);
}

export function getCadenceOptions(rhythm: Rhythm): string[] {
  const now = new Date();
  const year = now.getFullYear();

  if (rhythm === "quarterly") {
    const options: string[] = [];
    for (let y = year - 1; y <= year + 1; y++) {
      for (let q = 1; q <= 4; q++) {
        options.push(`${y}-Q${q}`);
      }
    }
    return options;
  }

  if (rhythm === "monthly") {
    const options: string[] = [];
    for (let y = year - 1; y <= year + 1; y++) {
      for (let m = 1; m <= 12; m++) {
        options.push(`${y}-${String(m).padStart(2, "0")}`);
      }
    }
    return options;
  }

  // adhoc — date picker handles selection, no predefined options
  return [];
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

const MONTH_NAMES_SHORT = [
  "Jan", "Feb", "Mar", "Apr", "May", "Jun",
  "Jul", "Aug", "Sep", "Oct", "Nov", "Dec",
];

export function formatCadenceLabel(cadence: string): string {
  // Quarterly: "2026-Q2" → "2026-Q2"
  if (/^\d{4}-Q[1-4]$/.test(cadence)) {
    return cadence;
  }
  // Monthly: "2026-04" → "April 2026"
  if (/^\d{4}-\d{2}$/.test(cadence)) {
    const [year, month] = cadence.split("-");
    return `${MONTH_NAMES[parseInt(month, 10) - 1]} ${year}`;
  }
  // Ad-hoc date: "2026-04-26" → "Apr 26, 2026"
  if (/^\d{4}-\d{2}-\d{2}$/.test(cadence)) {
    const [year, month, day] = cadence.split("-");
    return `${MONTH_NAMES_SHORT[parseInt(month, 10) - 1]} ${parseInt(day, 10)}, ${year}`;
  }
  return cadence;
}
