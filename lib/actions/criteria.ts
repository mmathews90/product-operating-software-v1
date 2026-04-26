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

const DEFAULT_CRITERIA: {
  name: string;
  dimension: Dimension;
  description: string;
  sort_order: number;
  target_score: number;
}[] = [
  // Product Knowledge
  {
    name: "Market & Customer Understanding",
    dimension: "product_knowledge",
    description:
      "Deep knowledge of target customers, their needs, and market dynamics",
    sort_order: 1,
    target_score: 7,
  },
  {
    name: "Data Fluency",
    dimension: "product_knowledge",
    description:
      "Ability to leverage quantitative and qualitative data for product decisions",
    sort_order: 2,
    target_score: 7,
  },
  {
    name: "Domain Expertise",
    dimension: "product_knowledge",
    description:
      "Understanding of the industry, competitive landscape, and technology trends",
    sort_order: 3,
    target_score: 7,
  },
  {
    name: "Business Acumen",
    dimension: "product_knowledge",
    description:
      "Understanding of business models, revenue, and go-to-market strategies",
    sort_order: 4,
    target_score: 7,
  },
  {
    name: "Technical Literacy",
    dimension: "product_knowledge",
    description:
      "Sufficient understanding of technology to make informed trade-off decisions",
    sort_order: 5,
    target_score: 7,
  },
  // Process Knowledge
  {
    name: "Product Discovery",
    dimension: "process_knowledge",
    description:
      "Ability to run effective discovery techniques (prototyping, experiments, user research)",
    sort_order: 1,
    target_score: 7,
  },
  {
    name: "Product Delivery",
    dimension: "process_knowledge",
    description:
      "Ability to ship reliably through agile practices and cross-functional collaboration",
    sort_order: 2,
    target_score: 7,
  },
  {
    name: "Roadmapping & Prioritization",
    dimension: "process_knowledge",
    description:
      "Skills in outcome-based roadmapping and prioritization frameworks",
    sort_order: 3,
    target_score: 7,
  },
  {
    name: "Product Strategy",
    dimension: "process_knowledge",
    description:
      "Ability to define and communicate a compelling product vision and strategy",
    sort_order: 4,
    target_score: 7,
  },
  {
    name: "Metrics & Outcomes",
    dimension: "process_knowledge",
    description:
      "Defining and tracking meaningful product metrics aligned to business outcomes",
    sort_order: 5,
    target_score: 7,
  },
  // People Skills
  {
    name: "Stakeholder Management",
    dimension: "people_skills",
    description:
      "Effective engagement with executives, partners, and cross-functional leaders",
    sort_order: 1,
    target_score: 7,
  },
  {
    name: "Team Collaboration",
    dimension: "people_skills",
    description:
      "Ability to work effectively with engineering, design, and other disciplines",
    sort_order: 2,
    target_score: 7,
  },
  {
    name: "Communication",
    dimension: "people_skills",
    description:
      "Clear, persuasive written and verbal communication skills",
    sort_order: 3,
    target_score: 7,
  },
  {
    name: "Leadership & Influence",
    dimension: "people_skills",
    description:
      "Ability to lead without authority and influence outcomes through trust",
    sort_order: 4,
    target_score: 7,
  },
  {
    name: "Coaching & Mentoring",
    dimension: "people_skills",
    description:
      "Supporting team growth through feedback, mentorship, and knowledge sharing",
    sort_order: 5,
    target_score: 7,
  },
];

export async function seedDefaultCriteria() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) throw new Error("Not authenticated");

  // Check if user already has criteria
  const { data: existing } = await supabase
    .from("assessment_criteria")
    .select("id")
    .limit(1);

  if (existing && existing.length > 0) return;

  const { error } = await supabase.from("assessment_criteria").insert(
    DEFAULT_CRITERIA.map((c) => ({
      ...c,
      user_id: user.id,
    }))
  );

  if (error) throw error;
}
