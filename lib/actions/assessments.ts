"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Assessment, AssessmentWithScores, DimensionTrendPoint } from "@/lib/types/assessments";

export async function getAssessmentsForPM(pmId: string) {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessments")
    .select("*")
    .eq("pm_id", pmId)
    .order("cadence", { ascending: false });

  if (error) throw error;
  return data;
}

export async function getAssessmentsPaginated({
  pmId,
  page = 1,
  pageSize = 10,
}: {
  pmId?: string;
  page?: number;
  pageSize?: number;
}): Promise<{
  data: (Assessment & { pm_name: string })[];
  total: number;
}> {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("assessments")
    .select("*, product_managers!inner(name)", { count: "exact" })
    .order("cadence", { ascending: false })
    .range(from, to);

  if (pmId) {
    query = query.eq("pm_id", pmId);
  }

  const { data, error, count } = await query;

  if (error) throw error;

  const mapped = (data ?? []).map((row: any) => ({
    ...row,
    pm_name: row.product_managers.name,
    product_managers: undefined,
  }));

  return { data: mapped, total: count ?? 0 };
}

export async function getAllPMsTrendData() {
  const { getProductManagers } = await import("./product-managers");
  const pms = await getProductManagers();

  const results = await Promise.all(
    pms.map(async (pm) => {
      const trends = await getTrendData(pm.id);
      return { pm, trends };
    })
  );

  return results;
}

export async function getAssessmentById(
  id: string
): Promise<AssessmentWithScores> {
  const supabase = await createClient();

  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .select("*")
    .eq("id", id)
    .single();

  if (assessmentError) throw assessmentError;

  const { data: scores, error: scoresError } = await supabase
    .from("assessment_scores")
    .select("*, criterion:assessment_criteria(*)")
    .eq("assessment_id", id)
    .order("criterion(dimension)")
    .order("criterion(sort_order)");

  if (scoresError) throw scoresError;

  return {
    ...assessment,
    scores: scores as AssessmentWithScores["scores"],
  };
}

export async function getLastScoresForPM(
  pmId: string,
  excludeAssessmentId?: string
): Promise<Record<string, number>> {
  const supabase = await createClient();

  // Find the most recent assessment for this PM
  let query = supabase
    .from("assessments")
    .select("id")
    .eq("pm_id", pmId)
    .order("cadence", { ascending: false })
    .limit(1);

  if (excludeAssessmentId) {
    query = query.neq("id", excludeAssessmentId);
  }

  const { data: assessments } = await query;
  if (!assessments || assessments.length === 0) return {};

  const { data: scores } = await supabase
    .from("assessment_scores")
    .select("criterion_id, current_score")
    .eq("assessment_id", assessments[0].id);

  if (!scores) return {};

  return Object.fromEntries(
    scores.map((s) => [s.criterion_id, s.current_score])
  );
}

export async function createAssessment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const pmId = formData.get("pm_id") as string;
  const cadence = formData.get("cadence") as string;
  const notes = (formData.get("notes") as string) || null;

  // Insert assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({
      user_id: user.id,
      pm_id: pmId,
      cadence,
      notes,
    })
    .select()
    .single();

  if (assessmentError) throw assessmentError;

  // Fetch criteria target scores to snapshot them
  const { data: criteria } = await supabase
    .from("assessment_criteria")
    .select("id, target_score");

  const targetMap = Object.fromEntries(
    (criteria ?? []).map((c: any) => [c.id, c.target_score])
  );

  // Collect scores from form data
  const scores: {
    assessment_id: string;
    criterion_id: string;
    target_score: number;
    current_score: number;
    notes: string | null;
  }[] = [];

  for (const [key, value] of formData.entries()) {
    if (key.startsWith("current_")) {
      const criterionId = key.replace("current_", "");
      scores.push({
        assessment_id: assessment.id,
        criterion_id: criterionId,
        current_score: parseInt(value as string),
        target_score: targetMap[criterionId] ?? 7,
        notes: (formData.get(`notes_${criterionId}`) as string) || null,
      });
    }
  }

  if (scores.length > 0) {
    const { error: scoresError } = await supabase
      .from("assessment_scores")
      .insert(scores);

    if (scoresError) throw scoresError;
  }

  revalidatePath("/protected/assessments");
  return assessment.id;
}

export async function updateAssessment(formData: FormData) {
  const supabase = await createClient();
  const assessmentId = formData.get("assessment_id") as string;
  const notes = (formData.get("notes") as string) || null;

  // Guard: cannot update completed assessments
  const { data: existing } = await supabase
    .from("assessments")
    .select("status")
    .eq("id", assessmentId)
    .single();

  if (existing?.status === "completed") {
    throw new Error("Completed assessments cannot be edited");
  }

  // Update assessment notes
  const { error: assessmentError } = await supabase
    .from("assessments")
    .update({ notes, updated_at: new Date().toISOString() })
    .eq("id", assessmentId);

  if (assessmentError) throw assessmentError;

  // Fetch criteria target scores to snapshot them
  const { data: criteria } = await supabase
    .from("assessment_criteria")
    .select("id, target_score");

  const targetMap = Object.fromEntries(
    (criteria ?? []).map((c: any) => [c.id, c.target_score])
  );

  // Upsert scores
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("current_")) {
      const criterionId = key.replace("current_", "");
      const { error } = await supabase
        .from("assessment_scores")
        .upsert(
          {
            assessment_id: assessmentId,
            criterion_id: criterionId,
            current_score: parseInt(value as string),
            target_score: targetMap[criterionId] ?? 7,
            notes: (formData.get(`notes_${criterionId}`) as string) || null,
          },
          { onConflict: "assessment_id,criterion_id" }
        );

      if (error) throw error;
    }
  }

  revalidatePath("/protected/assessments");
}

export async function completeAssessment(formData: FormData) {
  const supabase = await createClient();
  const assessmentId = formData.get("assessment_id") as string;
  const notes = (formData.get("notes") as string) || null;

  // Guard: cannot complete an already-completed assessment
  const { data: existing } = await supabase
    .from("assessments")
    .select("status")
    .eq("id", assessmentId)
    .single();

  if (existing?.status === "completed") {
    throw new Error("This assessment is already completed");
  }

  // Update assessment with completed status
  const { error: assessmentError } = await supabase
    .from("assessments")
    .update({
      notes,
      status: "completed",
      updated_at: new Date().toISOString(),
    })
    .eq("id", assessmentId);

  if (assessmentError) throw assessmentError;

  // Fetch criteria target scores to snapshot them
  const { data: criteria } = await supabase
    .from("assessment_criteria")
    .select("id, target_score");

  const targetMap = Object.fromEntries(
    (criteria ?? []).map((c: any) => [c.id, c.target_score])
  );

  // Upsert scores
  for (const [key, value] of formData.entries()) {
    if (key.startsWith("current_")) {
      const criterionId = key.replace("current_", "");
      const { error } = await supabase
        .from("assessment_scores")
        .upsert(
          {
            assessment_id: assessmentId,
            criterion_id: criterionId,
            current_score: parseInt(value as string),
            target_score: targetMap[criterionId] ?? 7,
            notes: (formData.get(`notes_${criterionId}`) as string) || null,
          },
          { onConflict: "assessment_id,criterion_id" }
        );

      if (error) throw error;
    }
  }

  revalidatePath("/protected/assessments");
}

export async function deleteAssessment(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("assessments").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/protected/assessments");
}

export async function getTrendData(pmId: string): Promise<DimensionTrendPoint[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("assessments")
    .select(
      `
      cadence,
      assessment_scores (
        current_score,
        target_score,
        criterion:assessment_criteria (
          dimension
        )
      )
    `
    )
    .eq("pm_id", pmId)
    .order("cadence");

  if (error) throw error;

  // Compute dimension averages per cadence period
  const cadenceDimensions = new Map<
    string,
    Map<string, { currentSum: number; targetSum: number; count: number }>
  >();

  for (const assessment of data) {
    if (!cadenceDimensions.has(assessment.cadence)) {
      cadenceDimensions.set(assessment.cadence, new Map());
    }
    const dimMap = cadenceDimensions.get(assessment.cadence)!;

    for (const score of assessment.assessment_scores as any[]) {
      const dimension = score.criterion?.dimension;
      if (!dimension) continue;

      if (!dimMap.has(dimension)) {
        dimMap.set(dimension, { currentSum: 0, targetSum: 0, count: 0 });
      }
      const entry = dimMap.get(dimension)!;
      entry.currentSum += score.current_score;
      entry.targetSum += score.target_score;
      entry.count += 1;
    }
  }

  const result: DimensionTrendPoint[] = [];
  for (const [cadence, dimMap] of cadenceDimensions) {
    for (const [dimension, stats] of dimMap) {
      result.push({
        cadence,
        dimension: dimension as DimensionTrendPoint["dimension"],
        avg_current: Math.round((stats.currentSum / stats.count) * 10) / 10,
        avg_target: Math.round((stats.targetSum / stats.count) * 10) / 10,
      });
    }
  }

  return result;
}
