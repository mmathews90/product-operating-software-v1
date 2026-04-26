"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getPMLevels() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("pm_levels")
    .select("*")
    .order("sort_order");

  if (error) throw error;
  return data;
}

export async function createPMLevel(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("pm_levels").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    sort_order: parseInt(formData.get("sort_order") as string) || 0,
  });

  if (error) throw error;
  revalidatePath("/protected/admin/levels");
  revalidatePath("/protected/admin/product-managers");
}

export async function updatePMLevel(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("pm_levels")
    .update({
      name: formData.get("name") as string,
      sort_order: parseInt(formData.get("sort_order") as string) || 0,
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/protected/admin/levels");
  revalidatePath("/protected/admin/product-managers");
}

export async function deletePMLevel(id: string) {
  const supabase = await createClient();
  const { error } = await supabase.from("pm_levels").delete().eq("id", id);

  if (error) throw error;
  revalidatePath("/protected/admin/levels");
  revalidatePath("/protected/admin/product-managers");
}

export async function seedDefaultLevels() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data: existing } = await supabase
    .from("pm_levels")
    .select("id")
    .limit(1);

  if (existing && existing.length > 0) return;

  const { error } = await supabase.from("pm_levels").insert([
    { user_id: user.id, name: "Standard", sort_order: 1 },
    { user_id: user.id, name: "Senior", sort_order: 2 },
    { user_id: user.id, name: "Principal", sort_order: 3 },
  ]);

  if (error) throw error;
  revalidatePath("/protected/admin/levels");
}
