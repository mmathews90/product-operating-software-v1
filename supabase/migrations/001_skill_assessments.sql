-- ============================================
-- PM Skill Assessment Schema
-- ============================================

-- 1. Product Managers
create table public.product_managers (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  role text,
  avatar_url text,
  created_at timestamptz not null default now()
);

alter table public.product_managers enable row level security;
create policy "Users manage own PMs"
  on public.product_managers for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_product_managers_user on public.product_managers(user_id);

-- 2. Assessment Criteria (template of what gets scored)
create table public.assessment_criteria (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  dimension text not null check (dimension in ('product_knowledge', 'process_knowledge', 'people_skills')),
  description text,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.assessment_criteria enable row level security;
create policy "Users manage own criteria"
  on public.assessment_criteria for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_assessment_criteria_user on public.assessment_criteria(user_id);

-- 3. Assessments (one per PM per quarter)
create table public.assessments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  pm_id uuid not null references public.product_managers(id) on delete cascade,
  quarter text not null,
  notes text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (pm_id, quarter)
);

alter table public.assessments enable row level security;
create policy "Users manage own assessments"
  on public.assessments for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_assessments_pm on public.assessments(pm_id);
create index idx_assessments_user on public.assessments(user_id);

-- 4. Assessment Scores (gap analysis rows)
create table public.assessment_scores (
  id uuid primary key default gen_random_uuid(),
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  criterion_id uuid not null references public.assessment_criteria(id) on delete cascade,
  target_score int not null check (target_score between 1 and 10),
  current_score int not null check (current_score between 1 and 10),
  notes text,
  unique (assessment_id, criterion_id)
);

alter table public.assessment_scores enable row level security;
create policy "Users manage own scores"
  on public.assessment_scores for all
  using (
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

create index idx_assessment_scores_assessment on public.assessment_scores(assessment_id);
