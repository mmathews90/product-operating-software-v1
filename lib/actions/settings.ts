"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { UserSettings } from "@/lib/types/assessments";

export async function getUserSettings(): Promise<UserSettings> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("user_settings")
    .select("*")
    .eq("user_id", user.id)
    .single();

  if (data) return data as UserSettings;

  // No settings yet — create default row
  if (error && error.code === "PGRST116") {
    const { data: created, error: insertError } = await supabase
      .from("user_settings")
      .insert({
        user_id: user.id,
        rhythm: "quarterly",
        notification_email: user.email ?? null,
      })
      .select()
      .single();

    if (insertError) throw insertError;
    return created as UserSettings;
  }

  throw error;
}

export async function updateUserSettings(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const rhythm = formData.get("rhythm") as string;
  const notification_email =
    (formData.get("notification_email") as string) || null;

  const { error } = await supabase
    .from("user_settings")
    .update({
      rhythm,
      notification_email,
      updated_at: new Date().toISOString(),
    })
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/protected/admin/settings");
  revalidatePath("/protected/assessments");
}
