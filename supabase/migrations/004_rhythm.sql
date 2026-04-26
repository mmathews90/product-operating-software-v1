-- ============================================
-- Rhythm Feature: Flexible Assessment Cadence
-- ============================================

-- 1. Rename quarter → cadence
ALTER TABLE public.assessments RENAME COLUMN quarter TO cadence;

-- 2. Replace rigid unique constraint with partial unique index
--    Only enforces uniqueness for structured periods (quarterly/monthly),
--    allowing unlimited ad-hoc assessments on the same date.
ALTER TABLE public.assessments DROP CONSTRAINT assessments_pm_id_quarter_key;

CREATE UNIQUE INDEX idx_assessments_pm_cadence_unique
  ON public.assessments (pm_id, cadence)
  WHERE cadence ~ '^\d{4}-(Q[1-4]|\d{2})$';

-- 3. New columns on assessments for auto-creation tracking
ALTER TABLE public.assessments ADD COLUMN auto_created boolean NOT NULL DEFAULT false;
ALTER TABLE public.assessments ADD COLUMN notified_at timestamptz;

-- 4. User settings table
CREATE TABLE public.user_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  rhythm text NOT NULL DEFAULT 'quarterly' CHECK (rhythm IN ('adhoc', 'monthly', 'quarterly')),
  notification_email text,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE public.user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Users manage own settings" ON public.user_settings
  FOR ALL USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX idx_user_settings_user ON public.user_settings(user_id);

-- 5. Function to auto-create draft assessments based on user rhythm
CREATE OR REPLACE FUNCTION public.create_scheduled_assessments()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  r RECORD;
  period_str text;
BEGIN
  FOR r IN
    SELECT us.user_id, us.rhythm
    FROM public.user_settings us
    WHERE us.rhythm IN ('monthly', 'quarterly')
  LOOP
    -- Compute current period string
    IF r.rhythm = 'quarterly' THEN
      period_str := to_char(now(), 'YYYY') || '-Q' || ceil(extract(month FROM now()) / 3)::int;
    ELSIF r.rhythm = 'monthly' THEN
      period_str := to_char(now(), 'YYYY-MM');
    END IF;

    -- Insert draft assessments for each PM belonging to this user
    INSERT INTO public.assessments (user_id, pm_id, cadence, status, auto_created)
    SELECT r.user_id, pm.id, period_str, 'draft', true
    FROM public.product_managers pm
    WHERE pm.user_id = r.user_id
    ON CONFLICT DO NOTHING;
  END LOOP;
END;
$$;

-- 6. Schedule pg_cron jobs
-- Requires pg_cron and pg_net extensions. Enable them in the Supabase dashboard
-- (Database → Extensions) then run this block manually:
--
-- SELECT cron.schedule(
--   'create-scheduled-assessments',
--   '0 9 1 * *',
--   $$SELECT public.create_scheduled_assessments()$$
-- );
--
-- SELECT cron.schedule(
--   'notify-scheduled-assessments',
--   '5 9 1 * *',
--   $$SELECT net.http_post(
--     url := current_setting('app.settings.app_url') || '/api/rhythm-notify',
--     headers := jsonb_build_object('Authorization', 'Bearer ' || current_setting('app.settings.cron_secret')),
--     body := '{}'::jsonb
--   )$$
-- );
