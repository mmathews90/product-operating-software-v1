-- ============================================
-- OKR Goal-Setting
-- ============================================

-- 1. Objectives (linked to assessments & PMs)
create table public.objectives (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  assessment_id uuid not null references public.assessments(id) on delete cascade,
  pm_id uuid not null references public.product_managers(id) on delete cascade,
  criterion_id uuid references public.assessment_criteria(id) on delete set null,
  title text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.objectives enable row level security;
create policy "Users manage own objectives"
  on public.objectives for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_objectives_user on public.objectives(user_id);
create index idx_objectives_assessment on public.objectives(assessment_id);
create index idx_objectives_pm on public.objectives(pm_id);

-- 2. Key Results (belong to an objective)
create table public.key_results (
  id uuid primary key default gen_random_uuid(),
  objective_id uuid not null references public.objectives(id) on delete cascade,
  title text not null,
  status text not null default 'not_started' check (status in ('not_started', 'in_progress', 'completed')),
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.key_results enable row level security;
create policy "Users manage own key results"
  on public.key_results for all
  using (
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

create index idx_key_results_objective on public.key_results(objective_id);
