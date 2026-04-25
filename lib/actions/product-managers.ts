"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function getProductManagers() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("product_managers")
    .select("*")
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
  });

  if (error) throw error;
  revalidatePath("/protected/assessments");
}

export async function deleteProductManager(id: string) {
  const supabase = await createClient();
  const { error } = await supabase
    .from("product_managers")
    .delete()
    .eq("id", id);

  if (error) throw error;
  revalidatePath("/protected/assessments");
}
