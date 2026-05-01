"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { GoalStatus, ObjectiveWithKeyResults } from "@/lib/types/goals";

export async function getAllObjectives(): Promise<
  (ObjectiveWithKeyResults & { pm_name: string; assessment_cadence: string })[]
> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objectives")
    .select(
      "*, key_results(*), criterion:assessment_criteria(id, name, dimension), assessment:assessments(cadence), pm:product_managers(name), subject:user_profiles!objectives_subject_user_id_fkey(display_name)"
    )
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    key_results: row.key_results ?? [],
    criterion: row.criterion ?? null,
    pm_name: row.subject?.display_name ?? row.pm?.name ?? "",
    assessment_cadence: row.assessment?.cadence ?? "",
    pm: undefined,
    subject: undefined,
    assessment: undefined,
  }));
}

export async function getObjectivesForAssessment(
  assessmentId: string
): Promise<ObjectiveWithKeyResults[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objectives")
    .select(
      "*, key_results(*), criterion:assessment_criteria(id, name, dimension)"
    )
    .eq("assessment_id", assessmentId)
    .order("created_at");

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    key_results: row.key_results ?? [],
    criterion: row.criterion ?? null,
  }));
}

export async function getObjectivesForPM(
  pmId: string
): Promise<ObjectiveWithKeyResults[]> {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("objectives")
    .select(
      "*, key_results(*), criterion:assessment_criteria(id, name, dimension)"
    )
    .eq("pm_id", pmId)
    .order("created_at", { ascending: false });

  if (error) throw error;

  return (data ?? []).map((row: any) => ({
    ...row,
    key_results: row.key_results ?? [],
    criterion: row.criterion ?? null,
  }));
}

export async function createBulkObjectives(data: {
  assessmentId: string;
  pmId?: string;
  subjectUserId?: string;
  objectives: {
    title: string;
    criterionId: string | null;
    keyResults: { title: string }[];
  }[];
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  for (const obj of data.objectives) {
    const { data: objective, error: objError } = await supabase
      .from("objectives")
      .insert({
        user_id: user.id,
        assessment_id: data.assessmentId,
        pm_id: data.pmId || null,
        subject_user_id: data.subjectUserId || null,
        criterion_id: obj.criterionId || null,
        title: obj.title,
      })
      .select()
      .single();

    if (objError) throw objError;

    if (obj.keyResults.length > 0) {
      const krs = obj.keyResults.map((kr, i) => ({
        objective_id: objective.id,
        title: kr.title,
        sort_order: i,
      }));

      const { error: krError } = await supabase
        .from("key_results")
        .insert(krs);

      if (krError) throw krError;
    }
  }

  revalidatePath("/protected/goals");
  revalidatePath("/protected/assessments");
}

export async function updateObjective(data: {
  id: string;
  title?: string;
  criterionId?: string | null;
  status?: GoalStatus;
}) {
  const supabase = await createClient();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (data.title !== undefined) updates.title = data.title;
  if (data.criterionId !== undefined) updates.criterion_id = data.criterionId;
  if (data.status !== undefined) updates.status = data.status;

  const { error } = await supabase
    .from("objectives")
    .update(updates)
    .eq("id", data.id);

  if (error) throw error;

  revalidatePath("/protected/goals");
  revalidatePath("/protected/assessments");
}

export async function deleteObjective(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("objectives")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/protected/goals");
  revalidatePath("/protected/assessments");
}

export async function updateKeyResult(data: {
  id: string;
  title?: string;
  status?: GoalStatus;
}) {
  const supabase = await createClient();

  const updates: Record<string, any> = {
    updated_at: new Date().toISOString(),
  };
  if (data.title !== undefined) updates.title = data.title;
  if (data.status !== undefined) updates.status = data.status;

  const { error } = await supabase
    .from("key_results")
    .update(updates)
    .eq("id", data.id);

  if (error) throw error;

  revalidatePath("/protected/goals");
}

export async function scoreObjective(data: {
  objectiveId: string;
  phase: "mid_point" | "final";
  krScores: { id: string; score: number }[];
  notes: string;
}) {
  const supabase = await createClient();

  // Validate scores
  for (const kr of data.krScores) {
    if (kr.score < 0 || kr.score > 1 || Math.round(kr.score * 10) !== kr.score * 10) {
      throw new Error(`Invalid score ${kr.score} — must be 0.0-1.0 in tenths`);
    }
  }

  const scoreCol = data.phase === "mid_point" ? "mid_point_score" : "final_score";
  const notesCol = data.phase === "mid_point" ? "mid_point_notes" : "final_notes";

  // Update each KR's score
  for (const kr of data.krScores) {
    const { error } = await supabase
      .from("key_results")
      .update({ [scoreCol]: kr.score, updated_at: new Date().toISOString() })
      .eq("id", kr.id);
    if (error) throw error;
  }

  // Compute average
  const avg = data.krScores.length > 0
    ? Math.round((data.krScores.reduce((sum, kr) => sum + kr.score, 0) / data.krScores.length) * 10) / 10
    : 0;

  // Update objective: cached score, notes, status
  const newStatus = data.phase === "mid_point" ? "in_progress" : "completed";
  const { error } = await supabase
    .from("objectives")
    .update({
      [scoreCol]: avg,
      [notesCol]: data.notes || null,
      status: newStatus,
      updated_at: new Date().toISOString(),
    })
    .eq("id", data.objectiveId);

  if (error) throw error;

  revalidatePath("/protected/goals");
  revalidatePath("/protected/assessments");
}

export async function deleteKeyResult(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("key_results")
    .delete()
    .eq("id", id);

  if (error) throw error;

  revalidatePath("/protected/goals");
}
