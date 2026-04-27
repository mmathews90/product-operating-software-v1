-- ============================================
-- OKR Scoring (mid-point & final)
-- ============================================

-- Key results get individual 0-1 scores
ALTER TABLE public.key_results
  ADD COLUMN mid_point_score numeric(2,1) CHECK (mid_point_score >= 0 AND mid_point_score <= 1),
  ADD COLUMN final_score numeric(2,1) CHECK (final_score >= 0 AND final_score <= 1);

-- Objectives get notes + cached average scores
ALTER TABLE public.objectives
  ADD COLUMN mid_point_notes text,
  ADD COLUMN final_notes text,
  ADD COLUMN mid_point_score numeric(2,1),
  ADD COLUMN final_score numeric(2,1);
