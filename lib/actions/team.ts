"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import type { TeamMembership, UserProfile } from "@/lib/types/assessments";

export async function getTeamMembers(): Promise<
  (TeamMembership & { member: UserProfile })[]
> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { data, error } = await supabase
    .from("team_memberships")
    .select("*, member:user_profiles!team_memberships_member_id_fkey(*)")
    .eq("lead_id", user.id)
    .order("created_at", { ascending: true });

  if (error) throw error;

  return data as (TeamMembership & { member: UserProfile })[];
}

export async function getMyLead(): Promise<UserProfile | null> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  const { data, error } = await supabase
    .from("team_memberships")
    .select("lead_id")
    .eq("member_id", user.id)
    .limit(1)
    .single();

  if (error && error.code === "PGRST116") return null;
  if (error) throw error;

  const { data: profile, error: profileError } = await supabase
    .from("user_profiles")
    .select("*")
    .eq("id", data.lead_id)
    .single();

  if (profileError) throw profileError;
  return profile as UserProfile;
}

export async function addTeamMember(memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase.from("team_memberships").insert({
    lead_id: user.id,
    member_id: memberId,
  });

  if (error) throw error;
  revalidatePath("/protected");
}

export async function removeTeamMember(memberId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("team_memberships")
    .delete()
    .eq("lead_id", user.id)
    .eq("member_id", memberId);

  if (error) throw error;
  revalidatePath("/protected");
}

export async function linkPmToUser(pmId: string, userId: string) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  const { error } = await supabase
    .from("product_managers")
    .update({ linked_user_id: userId })
    .eq("id", pmId)
    .eq("user_id", user.id);

  if (error) throw error;
  revalidatePath("/protected");
}
