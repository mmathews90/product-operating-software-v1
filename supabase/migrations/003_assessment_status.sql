-- ============================================
-- Assessment Status (draft / completed)
-- ============================================

alter table public.assessments
  add column status text not null default 'draft'
  check (status in ('draft', 'completed'));
