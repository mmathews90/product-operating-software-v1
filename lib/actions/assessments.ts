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
    .order("quarter", { ascending: false });

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
    .order("quarter", { ascending: false })
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

export async function createAssessment(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const pmId = formData.get("pm_id") as string;
  const quarter = formData.get("quarter") as string;
  const notes = (formData.get("notes") as string) || null;

  // Insert assessment
  const { data: assessment, error: assessmentError } = await supabase
    .from("assessments")
    .insert({
      user_id: user.id,
      pm_id: pmId,
      quarter,
      notes,
    })
    .select()
    .single();

  if (assessmentError) throw assessmentError;

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
        target_score: parseInt(formData.get(`target_${criterionId}`) as string),
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
            target_score: parseInt(
              formData.get(`target_${criterionId}`) as string
            ),
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
            target_score: parseInt(
              formData.get(`target_${criterionId}`) as string
            ),
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
      quarter,
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
    .order("quarter");

  if (error) throw error;

  // Compute dimension averages per quarter
  const quarterDimensions = new Map<
    string,
    Map<string, { currentSum: number; targetSum: number; count: number }>
  >();

  for (const assessment of data) {
    if (!quarterDimensions.has(assessment.quarter)) {
      quarterDimensions.set(assessment.quarter, new Map());
    }
    const dimMap = quarterDimensions.get(assessment.quarter)!;

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
  for (const [quarter, dimMap] of quarterDimensions) {
    for (const [dimension, stats] of dimMap) {
      result.push({
        quarter,
        dimension: dimension as DimensionTrendPoint["dimension"],
        avg_current: Math.round((stats.currentSum / stats.count) * 10) / 10,
        avg_target: Math.round((stats.targetSum / stats.count) * 10) / 10,
      });
    }
  }

  return result;
}
