-- Poller run history table for observability
CREATE TABLE public.poller_runs (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  started_at timestamptz NOT NULL DEFAULT now(),
  finished_at timestamptz,
  processed integer NOT NULL DEFAULT 0,
  alerts_sent integer NOT NULL DEFAULT 0,
  errors jsonb NOT NULL DEFAULT '[]'::jsonb,
  duration_ms integer,
  ok boolean NOT NULL DEFAULT true
);

CREATE INDEX idx_poller_runs_started_at ON public.poller_runs (started_at DESC);

ALTER TABLE public.poller_runs ENABLE ROW LEVEL SECURITY;

-- Only admins can read poller_runs (cron job writes via service role and bypasses RLS).
CREATE POLICY "Admins view poller runs"
  ON public.poller_runs
  FOR SELECT
  TO authenticated
  USING (public.has_role(auth.uid(), 'admin'::app_role));