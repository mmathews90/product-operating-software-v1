# Rhythm Feature: Flexible Assessment Cadence

## Context

The `assessments` table has a unique constraint on `(pm_id, quarter)` that causes a 500 error when creating a second assessment for the same PM+quarter. Rather than patching this narrowly, we're replacing the rigid quarterly model with a configurable "rhythm" system. Users choose their preferred cadence (ad-hoc, monthly, quarterly), assessments are auto-created at that rhythm, and an email notifies them when it's time to score.

## Schema Changes — `supabase/migrations/004_rhythm.sql`

### 1. Rename `quarter` → `cadence` on `assessments`
```sql
ALTER TABLE public.assessments RENAME COLUMN quarter TO cadence;
```
Existing `YYYY-QN` values remain valid. No data migration needed.

### 2. Replace unique constraint with partial unique index
```sql
ALTER TABLE public.assessments DROP CONSTRAINT assessments_pm_id_quarter_key;

-- Enforce uniqueness only for structured periods (quarterly/monthly), not ad-hoc dates
CREATE UNIQUE INDEX idx_assessments_pm_cadence_unique
  ON public.assessments (pm_id, cadence)
  WHERE cadence ~ '^\d{4}-(Q[1-4]|\d{2})$';
```

### 3. New `user_settings` table
```sql
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
  FOR ALL USING (auth.uid() = user_id);
```

### 4. Add `auto_created` + `notified_at` columns to assessments
```sql
ALTER TABLE public.assessments ADD COLUMN auto_created boolean NOT NULL DEFAULT false;
ALTER TABLE public.assessments ADD COLUMN notified_at timestamptz;
```

### 5. pg_cron function for auto-creating draft assessments
Database function `create_scheduled_assessments()` that:
- Iterates users with rhythm = 'monthly' or 'quarterly'
- Computes the current period string for that rhythm
- Inserts draft assessments per PM with `ON CONFLICT DO NOTHING`
- Scheduled via `cron.schedule` to run 1st of every month at 9am UTC

### 6. pg_net call for email notification
After creating assessments, use `net.http_post` to call a Next.js API route that sends emails via Resend.

## Cadence Format

| Rhythm    | Format      | Example      |
|-----------|-------------|--------------|
| Quarterly | `YYYY-QN`   | `2026-Q2`    |
| Monthly   | `YYYY-MM`   | `2026-04`    |
| Ad-hoc    | `YYYY-MM-DD`| `2026-04-26` |

All formats sort lexicographically. Existing data (`YYYY-QN`) requires no migration.

## TypeScript Changes

### `lib/types/assessments.ts`
- Rename `quarter` → `cadence` in `Assessment` and `DimensionTrendPoint` interfaces
- Add `auto_created?: boolean`, `notified_at?: string` to `Assessment`
- Add `type Rhythm = 'adhoc' | 'monthly' | 'quarterly'`
- Add `UserSettings` interface
- Replace `getCurrentQuarter()` → `getCurrentCadence(rhythm: Rhythm): string`
- Replace `getQuarterOptions()` → `getCadenceOptions(rhythm: Rhythm): string[]`
- Add `formatCadenceLabel(cadence: string): string` — renders "2026-Q2" as-is, "2026-04" as "April 2026", "2026-04-26" as "Apr 26, 2026"

### `lib/actions/assessments.ts`
- All `quarter` references → `cadence` (createAssessment, getAssessmentsPaginated, getTrendData, etc.)
- `createAssessment`: read `cadence` from formData instead of `quarter`

### New: `lib/actions/settings.ts`
- `getUserSettings()` — fetch or create default for current user
- `updateUserSettings(formData: FormData)` — update rhythm + notification email

## UI Changes

### `components/assessments/assessment-form.tsx`
- Quarter selector becomes cadence-aware:
  - **Quarterly**: select from `YYYY-QN` options (same as today)
  - **Monthly**: select from month options ("April 2026", "May 2026", ...)
  - **Ad-hoc**: date picker defaulting to today
- Label changes: "Quarter" → "Period" in UI text
- Form field name: `quarter` → `cadence`
- Receives `rhythm` prop from page to determine selector type

### `components/assessments/assessment-table.tsx`
- Column header "Quarter" → "Period"
- Cell display uses `formatCadenceLabel()`

### `components/assessments/trend-chart.tsx`
- X-axis uses `formatCadenceLabel()` for labels
- Data key `quarter` → `cadence`

### `app/protected/assessments/[assessmentId]/page.tsx`
- `assessment.quarter` → `assessment.cadence` with `formatCadenceLabel()`

### `app/protected/assessments/new/page.tsx`
- Fetch user settings, pass `rhythm` to AssessmentForm

### `app/protected/assessments/trends/page.tsx`
- Update any `quarter` references in data handling

### `components/assessments/assessment-list.tsx`
- `quarter` → `cadence` references

### New: Settings tab in Admin
- Add "Settings" tab to `app/protected/admin/layout.tsx`
- New page `app/protected/admin/settings/page.tsx`:
  - Rhythm selector (radio group: Ad-hoc / Monthly / Quarterly)
  - Notification email field (pre-filled from auth email)
  - Save via `updateUserSettings` server action

## Email Notification — `app/api/rhythm-notify/route.ts`

- Install `resend` package
- POST endpoint secured with a `CRON_SECRET` env var
- Queries assessments where `auto_created = true AND notified_at IS NULL`
- Groups by user, sends one email per user: "You have N draft assessments for {period}"
- Updates `notified_at` after sending
- Called by pg_cron via `net.http_post` 5 minutes after auto-creation

## Files to Modify

1. `supabase/migrations/004_rhythm.sql` — **new** (schema + pg_cron)
2. `lib/types/assessments.ts` — types + cadence utilities
3. `lib/actions/assessments.ts` — quarter→cadence rename throughout
4. `lib/actions/settings.ts` — **new** (settings CRUD)
5. `components/assessments/assessment-form.tsx` — cadence-aware selector
6. `components/assessments/assessment-table.tsx` — column rename + formatting
7. `components/assessments/trend-chart.tsx` — data key rename
8. `components/assessments/assessment-list.tsx` — quarter→cadence
9. `app/protected/assessments/[assessmentId]/page.tsx` — display rename
10. `app/protected/assessments/new/page.tsx` — pass rhythm to form
11. `app/protected/assessments/trends/page.tsx` — data key rename
12. `app/protected/admin/layout.tsx` — add Settings tab
13. `app/protected/admin/settings/page.tsx` — **new** (settings UI)
14. `app/api/rhythm-notify/route.ts` — **new** (email endpoint)
15. `package.json` — add `resend` dependency

## Implementation Order

1. **Migration + types** — schema changes, TS interfaces, utility functions
2. **Server actions** — quarter→cadence rename, new settings actions
3. **UI components** — form, table, chart, detail page updates
4. **Settings page** — admin tab + settings form
5. **Auto-creation** — pg_cron function + schedule
6. **Email** — Resend integration, API route, pg_cron notification trigger

## Verification

1. Run `npx supabase db reset` to apply migration
2. Create an assessment for a PM — should succeed
3. Create another assessment for same PM + same cadence (quarterly) — should fail with the partial unique index
4. Change rhythm to ad-hoc in settings, create multiple same-day assessments — should succeed
5. Run `SELECT public.create_scheduled_assessments()` manually — verify draft assessments appear
6. Hit the notify API route — verify email sends and `notified_at` is set
7. Verify trend charts render correctly with existing quarterly data
8. Test the assessment form with each rhythm mode (quarterly selector, monthly selector, date picker)
