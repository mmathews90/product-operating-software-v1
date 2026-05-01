-- ============================================
-- Multiplayer Foundation: User Profiles, Functions, Roles
-- ============================================

-- ============================================
-- STAGE 1: New tables
-- ============================================

-- 1. User profiles (1:1 with auth.users)
create table public.user_profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null,
  function text not null check (function in ('product_management', 'product_design', 'product_operations')),
  role text not null,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),

  constraint valid_function_role check (
    (function = 'product_management' and role in ('product_manager', 'product_lead'))
    or (function = 'product_design' and role in ('product_designer', 'design_lead'))
    or (function = 'product_operations' and role in ('product_ops_manager', 'product_ops_lead'))
  )
);

alter table public.user_profiles enable row level security;

-- 2. Team memberships (lead -> member relationships)
create table public.team_memberships (
  id uuid primary key default gen_random_uuid(),
  lead_id uuid not null references public.user_profiles(id) on delete cascade,
  member_id uuid not null references public.user_profiles(id) on delete cascade,
  created_at timestamptz not null default now(),

  unique (lead_id, member_id),
  constraint no_self_membership check (lead_id != member_id)
);

alter table public.team_memberships enable row level security;

create index idx_team_memberships_lead on public.team_memberships(lead_id);
create index idx_team_memberships_member on public.team_memberships(member_id);

-- 3. Dimensions (global reference table, per function)
create table public.dimensions (
  id uuid primary key default gen_random_uuid(),
  function text not null check (function in ('product_management', 'product_design', 'product_operations')),
  slug text not null,
  label text not null,
  sort_order int not null default 0,

  unique (function, slug)
);

alter table public.dimensions enable row level security;

-- Seed PM dimensions (design & ops dimensions to be added later)
insert into public.dimensions (function, slug, label, sort_order) values
  ('product_management', 'product_knowledge', 'Product Knowledge', 1),
  ('product_management', 'process_knowledge', 'Process Knowledge', 2),
  ('product_management', 'people_skills', 'People Skills', 3);

-- 4. Default criteria templates (replaces hardcoded trigger)
create table public.default_criteria_templates (
  id uuid primary key default gen_random_uuid(),
  function text not null,
  dimension_slug text not null,
  name text not null,
  description text,
  sort_order int not null default 0,
  default_target_score int not null default 7 check (default_target_score between 1 and 10),

  foreign key (function, dimension_slug) references public.dimensions(function, slug)
);

alter table public.default_criteria_templates enable row level security;

-- Seed PM criteria templates (same 15 criteria from migration 007)
insert into public.default_criteria_templates (function, dimension_slug, name, description, sort_order, default_target_score) values
  -- Product Knowledge
  ('product_management', 'product_knowledge', 'Market & Customer Understanding', 'Deep knowledge of target customers, their needs, and market dynamics', 1, 7),
  ('product_management', 'product_knowledge', 'Data Fluency', 'Ability to leverage quantitative and qualitative data for product decisions', 2, 7),
  ('product_management', 'product_knowledge', 'Domain Expertise', 'Understanding of the industry, competitive landscape, and technology trends', 3, 7),
  ('product_management', 'product_knowledge', 'Business Acumen', 'Understanding of business models, revenue, and go-to-market strategies', 4, 7),
  ('product_management', 'product_knowledge', 'Technical Literacy', 'Sufficient understanding of technology to make informed trade-off decisions', 5, 7),
  -- Process Knowledge
  ('product_management', 'process_knowledge', 'Product Discovery', 'Ability to run effective discovery techniques (prototyping, experiments, user research)', 1, 7),
  ('product_management', 'process_knowledge', 'Product Delivery', 'Ability to ship reliably through agile practices and cross-functional collaboration', 2, 7),
  ('product_management', 'process_knowledge', 'Roadmapping & Prioritization', 'Skills in outcome-based roadmapping and prioritization frameworks', 3, 7),
  ('product_management', 'process_knowledge', 'Product Strategy', 'Ability to define and communicate a compelling product vision and strategy', 4, 7),
  ('product_management', 'process_knowledge', 'Metrics & Outcomes', 'Defining and tracking meaningful product metrics aligned to business outcomes', 5, 7),
  -- People Skills
  ('product_management', 'people_skills', 'Stakeholder Management', 'Effective engagement with executives, partners, and cross-functional leaders', 1, 7),
  ('product_management', 'people_skills', 'Team Collaboration', 'Ability to work effectively with engineering, design, and other disciplines', 2, 7),
  ('product_management', 'people_skills', 'Communication', 'Clear, persuasive written and verbal communication skills', 3, 7),
  ('product_management', 'people_skills', 'Leadership & Influence', 'Ability to lead without authority and influence outcomes through trust', 4, 7),
  ('product_management', 'people_skills', 'Coaching & Mentoring', 'Supporting team growth through feedback, mentorship, and knowledge sharing', 5, 7);

-- ============================================
-- STAGE 2: Backfill existing users as product_management/product_lead
-- ============================================

insert into public.user_profiles (id, display_name, function, role)
select
  u.id,
  coalesce(u.raw_user_meta_data->>'display_name', u.email),
  'product_management',
  'product_lead'
from auth.users u
where not exists (select 1 from public.user_profiles where id = u.id);

-- ============================================
-- STAGE 3: Alter existing tables
-- ============================================

-- 3a. assessment_criteria: add function column, replace CHECK with FK
alter table public.assessment_criteria
  drop constraint assessment_criteria_dimension_check;

alter table public.assessment_criteria
  add column function text not null default 'product_management'
  check (function in ('product_management', 'product_design', 'product_operations'));

alter table public.assessment_criteria
  add constraint fk_criteria_dimension
  foreign key (function, dimension) references public.dimensions(function, slug);

-- 3b. product_managers: add linked_user_id for connecting PM records to real users
alter table public.product_managers
  add column linked_user_id uuid unique references public.user_profiles(id) on delete set null;

-- 3c. assessments: add subject_user_id, make pm_id nullable
alter table public.assessments
  alter column pm_id drop not null;

alter table public.assessments
  add column subject_user_id uuid references public.user_profiles(id) on delete set null;

alter table public.assessments
  add constraint assessments_subject_check
  check (pm_id is not null or subject_user_id is not null);

-- 3d. objectives: add subject_user_id, make pm_id nullable
alter table public.objectives
  alter column pm_id drop not null;

alter table public.objectives
  add column subject_user_id uuid references public.user_profiles(id) on delete set null;

alter table public.objectives
  add constraint objectives_subject_check
  check (pm_id is not null or subject_user_id is not null);

-- ============================================
-- STAGE 4: Replace triggers
-- ============================================

-- Drop old signup trigger
drop trigger if exists on_auth_user_created on auth.users;
drop function if exists public.seed_default_criteria();

-- New trigger: create user_profiles from auth metadata on signup
create or replace function public.handle_new_user()
returns trigger as $$
begin
  -- Only create profile if metadata is present (new signups)
  -- Existing users were backfilled in stage 2
  if new.raw_user_meta_data->>'display_name' is not null
     and new.raw_user_meta_data->>'function' is not null
     and new.raw_user_meta_data->>'role' is not null then
    insert into public.user_profiles (id, display_name, function, role)
    values (
      new.id,
      new.raw_user_meta_data->>'display_name',
      new.raw_user_meta_data->>'function',
      new.raw_user_meta_data->>'role'
    );
  end if;
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();

-- New trigger: seed criteria from templates when a lead profile is created
create or replace function public.seed_criteria_for_profile()
returns trigger as $$
begin
  -- Only seed criteria for lead roles
  if new.role not in ('product_lead', 'design_lead', 'product_ops_lead') then
    return new;
  end if;

  insert into public.assessment_criteria (user_id, function, name, dimension, description, sort_order, target_score)
  select new.id, t.function, t.name, t.dimension_slug, t.description, t.sort_order, t.default_target_score
  from public.default_criteria_templates t
  where t.function = new.function;

  return new;
end;
$$ language plpgsql security definer;

create trigger on_user_profile_created
  after insert on public.user_profiles
  for each row execute function public.seed_criteria_for_profile();

-- ============================================
-- STAGE 5: RLS helper function
-- ============================================

create or replace function public.is_lead_of(member uuid)
returns boolean
language sql
security definer
stable
as $$
  select exists (
    select 1 from public.team_memberships
    where lead_id = auth.uid()
    and member_id = member
  );
$$;

-- ============================================
-- STAGE 6: Replace RLS policies
-- ============================================

-- 6a. user_profiles
create policy "Users read own or team profiles" on public.user_profiles
  for select using (
    id = auth.uid()
    or public.is_lead_of(id)
    or exists (
      select 1 from public.team_memberships
      where lead_id = id and member_id = auth.uid()
    )
  );

create policy "Users insert own profile" on public.user_profiles
  for insert with check (id = auth.uid());

create policy "Users update own profile" on public.user_profiles
  for update using (id = auth.uid())
  with check (id = auth.uid());

-- 6b. team_memberships
create policy "Leads manage team memberships" on public.team_memberships
  for all using (lead_id = auth.uid())
  with check (lead_id = auth.uid());

create policy "Members read own memberships" on public.team_memberships
  for select using (member_id = auth.uid());

-- 6c. dimensions (read-only for all authenticated users)
create policy "Authenticated users read dimensions" on public.dimensions
  for select using (auth.uid() is not null);

-- 6d. default_criteria_templates (read-only for all authenticated users)
create policy "Authenticated users read templates" on public.default_criteria_templates
  for select using (auth.uid() is not null);

-- 6e. assessments: replace old policy with lead + member access
drop policy if exists "Users manage own assessments" on public.assessments;

create policy "Leads manage own assessments" on public.assessments
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Members read own assessments" on public.assessments
  for select using (auth.uid() = subject_user_id);

-- 6f. assessment_scores: replace old policy with lead + member access
drop policy if exists "Users manage own scores" on public.assessment_scores;

create policy "Leads manage assessment scores" on public.assessment_scores
  for all using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_scores.assessment_id
      and a.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_scores.assessment_id
      and a.user_id = auth.uid()
    )
  );

create policy "Members read own assessment scores" on public.assessment_scores
  for select using (
    exists (
      select 1 from public.assessments a
      where a.id = assessment_scores.assessment_id
      and a.subject_user_id = auth.uid()
    )
  );

-- 6g. assessment_criteria: keep existing policy (leads own criteria)
-- Add read access for members (via their assessments)
create policy "Members read criteria used in their assessments" on public.assessment_criteria
  for select using (
    exists (
      select 1 from public.assessment_scores s
      join public.assessments a on a.id = s.assessment_id
      where s.criterion_id = assessment_criteria.id
      and a.subject_user_id = auth.uid()
    )
  );

-- 6h. objectives: replace old policy with lead + member access
drop policy if exists "Users manage own objectives" on public.objectives;

create policy "Leads manage own objectives" on public.objectives
  for all using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create policy "Members read own objectives" on public.objectives
  for select using (auth.uid() = subject_user_id);

-- 6i. key_results: replace old policy with lead + member access
drop policy if exists "Users manage own key results" on public.key_results;

create policy "Leads manage own key results" on public.key_results
  for all using (
    exists (
      select 1 from public.objectives o
      where o.id = key_results.objective_id
      and o.user_id = auth.uid()
    )
  )
  with check (
    exists (
      select 1 from public.objectives o
      where o.id = key_results.objective_id
      and o.user_id = auth.uid()
    )
  );

create policy "Members read own key results" on public.key_results
  for select using (
    exists (
      select 1 from public.objectives o
      where o.id = key_results.objective_id
      and o.subject_user_id = auth.uid()
    )
  );

-- ============================================
-- STAGE 7: Manager self-scoring RPC
-- ============================================

-- Allows managers to score their own key results
create or replace function public.score_own_key_result(
  p_kr_id uuid,
  p_phase text,
  p_score numeric
)
returns void
language plpgsql
security definer
as $$
begin
  -- Verify the caller is the subject of the objective's assessment
  if not exists (
    select 1 from public.key_results kr
    join public.objectives o on o.id = kr.objective_id
    join public.assessments a on a.id = o.assessment_id
    where kr.id = p_kr_id
    and a.subject_user_id = auth.uid()
  ) then
    raise exception 'Not authorized to score this key result';
  end if;

  if p_phase = 'mid_point' then
    update public.key_results set mid_point_score = p_score, updated_at = now() where id = p_kr_id;
  elsif p_phase = 'final' then
    update public.key_results set final_score = p_score, updated_at = now() where id = p_kr_id;
  else
    raise exception 'Invalid phase: must be mid_point or final';
  end if;
end;
$$;

-- Allows managers to score their own objectives
create or replace function public.score_own_objective(
  p_objective_id uuid,
  p_phase text,
  p_score numeric,
  p_notes text default null
)
returns void
language plpgsql
security definer
as $$
begin
  -- Verify the caller is the subject
  if not exists (
    select 1 from public.objectives o
    join public.assessments a on a.id = o.assessment_id
    where o.id = p_objective_id
    and a.subject_user_id = auth.uid()
  ) then
    raise exception 'Not authorized to score this objective';
  end if;

  if p_phase = 'mid_point' then
    update public.objectives
    set mid_point_score = p_score, mid_point_notes = coalesce(p_notes, mid_point_notes), updated_at = now()
    where id = p_objective_id;
  elsif p_phase = 'final' then
    update public.objectives
    set final_score = p_score, final_notes = coalesce(p_notes, final_notes), updated_at = now()
    where id = p_objective_id;
  else
    raise exception 'Invalid phase: must be mid_point or final';
  end if;
end;
$$;
