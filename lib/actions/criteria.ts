"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { Dimension } from "@/lib/types/assessments";

export async function getCriteria() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("assessment_criteria")
    .select("*")
    .order("dimension")
    .order("sort_order");

  if (error) throw error;
  return data;
}

export async function createCriterion(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("assessment_criteria").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    dimension: formData.get("dimension") as Dimension,
    description: (formData.get("description") as string) || null,
    sort_order: parseInt(formData.get("sort_order") as string) || 0,
    target_score: parseInt(formData.get("target_score") as string) || 7,
  });

  if (error) throw error;
  revalidatePath("/protected/assessments");
  revalidatePath("/protected/admin/criteria");
}

export async function updateCriterion(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("assessment_criteria")
    .update({
      name: formData.get("name") as string,
      dimension: formData.get("dimension") as Dimension,
      description: (formData.get("description") as string) || null,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
      target_score: parseInt(formData.get("target_score") as string) || 7,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/protected/assessments");
  revalidatePath("/protected/admin/criteria");
}

export async function deleteCriterion(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("assessment_criteria")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/protected/assessments");
  revalidatePath("/protected/admin/criteria");
}