"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserProfile, DimensionDef } from "@/lib/types/assessments";

export async function getProfile(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (error && error.code === "PGRST116") return null;
  if (error) throw error;

  return data as UserProfile;
}

export async function updateProfile(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const display_name = formData.get("display_name") as string;
  const avatar_url = (formData.get("avatar_url") as string) || null;

  const { error } = await supabase
    .from("user_profiles")
    .update({
      display_name,
      avatar_url,
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) throw error;
  revalidatePath("/protected");
}

export async function getDimensions(
  userFunction?: string
): Promise<DimensionDef[]> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  let query = supabase
    .from("dimensions")
    .select("*")
    .order("sort_order", { ascending: true });

  if (userFunction) {
    query = query.eq("function", userFunction);
  }

  const { data, error } = await query;
  if (error) throw error;

  return data as DimensionDef[];
}
