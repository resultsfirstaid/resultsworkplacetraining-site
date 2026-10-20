-- Run once in Supabase SQL Editor. No changes to existing course or booking tables.
CREATE TABLE IF NOT EXISTS public.workplace_course_content (
  course_id uuid PRIMARY KEY REFERENCES public.courses(id) ON DELETE CASCADE,
  workplace_title text,
  workplace_summary text,
  workplace_description text,
  ideal_for text,
  delivery_options text,
  featured boolean NOT NULL DEFAULT false,
  published boolean NOT NULL DEFAULT false,
  display_order integer DEFAULT 99,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
ALTER TABLE public.workplace_course_content ENABLE ROW LEVEL SECURITY;
INSERT INTO public.workplace_course_content (course_id, workplace_title, workplace_summary, published, display_order)
SELECT id, name, short_description, false, display_order
FROM public.courses WHERE active = true
ON CONFLICT (course_id) DO NOTHING;
-- After reviewing and approving a course, publish it explicitly, e.g.:
-- UPDATE public.workplace_course_content SET published=true WHERE course_id=(SELECT id FROM public.courses WHERE slug='providecpr');
