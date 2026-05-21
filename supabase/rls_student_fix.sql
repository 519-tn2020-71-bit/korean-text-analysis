-- Run this in Supabase SQL Editor to fix student dashboard visibility
-- This adds a SECURITY DEFINER function that bypasses RLS for reading released passages

CREATE OR REPLACE FUNCTION public.get_released_passages()
RETURNS TABLE (
  id uuid,
  teacher_id uuid,
  title text,
  "text" text,
  subject text,
  year int,
  created_at timestamptz,
  stage_released int
) LANGUAGE sql SECURITY DEFINER STABLE AS $$
  SELECT
    p.id, p.teacher_id, p.title, p.text, p.subject, p.year, p.created_at,
    ta.stage_released
  FROM public.passages p
  JOIN public.teacher_analyses ta ON ta.passage_id = p.id
  WHERE ta.stage_released >= 1
  ORDER BY p.created_at DESC;
$$;

-- anon(비로그인) 사용자는 접근 불가 — authenticated(로그인된 학생/교사)만 허용
REVOKE EXECUTE ON FUNCTION public.get_released_passages() FROM anon;
GRANT EXECUTE ON FUNCTION public.get_released_passages() TO authenticated;
