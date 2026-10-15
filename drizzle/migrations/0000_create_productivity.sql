CREATE TABLE public.emails (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  topic text NOT NULL DEFAULT '',
  purpose text NOT NULL DEFAULT '',
  tone text NOT NULL DEFAULT 'professional',
  subject text NOT NULL DEFAULT '',
  body text NOT NULL DEFAULT '',
  meeting_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.meetings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL DEFAULT 'Untitled meeting',
  notes text NOT NULL DEFAULT '',
  summary text NOT NULL DEFAULT '',
  key_points jsonb NOT NULL DEFAULT '[]',
  decisions jsonb NOT NULL DEFAULT '[]',
  action_items jsonb NOT NULL DEFAULT '[]',
  created_at timestamptz NOT NULL DEFAULT now()
);
CREATE TABLE public.tasks (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL DEFAULT auth.uid(),
  title text NOT NULL,
  description text NOT NULL DEFAULT '',
  priority text NOT NULL DEFAULT 'medium',
  status text NOT NULL DEFAULT 'todo',
  category text NOT NULL DEFAULT '',
  due_date date,
  meeting_id uuid,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.emails, public.meetings, public.tasks TO authenticated;
GRANT ALL ON public.emails, public.meetings, public.tasks TO service_role;
ALTER TABLE public.emails ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.meetings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tasks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own emails" ON public.emails FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own meetings" ON public.meetings FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own tasks" ON public.tasks FOR ALL TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);