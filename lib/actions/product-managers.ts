"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

function parseLevelId(value: string | null | undefined): string | null {
  if (!value || value === "none") return null;
  return value;
}

export async function getProductManagers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_managers")
    .select("*, level:pm_levels(*)")
    .order("name");

  if (error) throw error;
  return data;
}

export async function createProductManager(formData: FormData) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("product_managers").insert({
    user_id: user.id,
    name: formData.get("name") as string,
    role: (formData.get("role") as string) || null,
    level_id: parseLevelId(formData.get("level_id") as string),
  });

  if (error) throw error;
  revalidatePath("/protected/assessments");
  revalidatePath("/protected/admin/product-managers");
}

export async function updateProductManager(formData: FormData) {
  const supabase = await createClient();
  const id = formData.get("id") as string;

  const { error } = await supabase
    .from("product_managers")
    .update({
      name: formData.get("name") as string,
      role: (formData.get("role") as string) || null,
      level_id: parseLevelId(formData.get("level_id") as string),
    })
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/protected/assessments");
  revalidatePath("/protected/admin/product-managers");
}

export async function deleteProductManager(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_managers")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/protected/assessments");
  revalidatePath("/protected/admin/product-managers");
}
