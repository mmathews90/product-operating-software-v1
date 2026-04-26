-- ============================================
-- PM Levels
-- ============================================

-- 1. Levels lookup table
create table public.pm_levels (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now()
);

alter table public.pm_levels enable row level security;
create policy "Users manage own levels"
  on public.pm_levels for all
  using (auth.uid() = user_id)
  with check (auth.uid() = user_id);

create index idx_pm_levels_user on public.pm_levels(user_id);

-- 2. Add level_id to product_managers
alter table public.product_managers
  add column level_id uuid references public.pm_levels(id) on delete set null;
