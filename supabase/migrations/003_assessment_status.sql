-- ============================================
-- Assessment Status (draft / completed)
-- ============================================

alter table public.assessments
  add column status text not null default 'draft'
  check (status in ('draft', 'completed'));

-- ============================================
-- Move target scores to criteria (source of truth)
-- ============================================

alter table public.assessment_criteria
  add column target_score int not null default 7
  check (target_score between 1 and 10);
