-- 독서 지문 분석 웹앱 — Supabase 스키마
-- Supabase 대시보드 > SQL Editor에서 실행하세요

-- ============================================================
-- EXTENSIONS
-- ============================================================
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- ============================================================
-- USERS TABLE (Supabase auth.users를 참조하는 커스텀 메타데이터)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.users (
  id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email text,
  role text NOT NULL DEFAULT 'student' CHECK (role IN ('teacher', 'student')),
  api_provider text DEFAULT 'gemini' CHECK (api_provider IN ('gemini', 'openrouter', 'claude')),
  api_key_encrypted text,
  gemini_model text DEFAULT 'gemini-2.5-flash-lite',
  openrouter_model text DEFAULT 'google/gemini-2.5-flash',
  created_at timestamptz DEFAULT now()
);

-- Automatically create user row on signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger AS $$
BEGIN
  INSERT INTO public.users (id, email, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'role', 'student')
  );
  RETURN new;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- PASSAGES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.passages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  teacher_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  title text NOT NULL,
  text text NOT NULL,
  subject text NOT NULL DEFAULT '인문' CHECK (subject IN ('인문', '사회', '과학', '기술', '예술')),
  year int NOT NULL DEFAULT 2025,
  created_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS passages_teacher_id_idx ON public.passages(teacher_id);
CREATE INDEX IF NOT EXISTS passages_created_at_idx ON public.passages(created_at DESC);

-- ============================================================
-- TEACHER_ANALYSES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.teacher_analyses (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  passage_id uuid NOT NULL REFERENCES public.passages(id) ON DELETE CASCADE,
  analysis_json jsonb,         -- Full AI analysis result
  annotations jsonb,           -- Annotation overrides (edited by teacher)
  summary jsonb,               -- Paragraph summary overrides
  mindmap jsonb,               -- Mindmap data overrides
  compare_card jsonb,          -- Compare card overrides
  stage_released int NOT NULL DEFAULT 0 CHECK (stage_released BETWEEN 0 AND 3),
  updated_at timestamptz DEFAULT now()
);

CREATE INDEX IF NOT EXISTS teacher_analyses_passage_id_idx ON public.teacher_analyses(passage_id);

-- ============================================================
-- STUDENT_ACTIVITIES TABLE
-- ============================================================
CREATE TABLE IF NOT EXISTS public.student_activities (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  student_id uuid NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  passage_id uuid NOT NULL REFERENCES public.passages(id) ON DELETE CASCADE,
  whiteboard_data text,        -- base64 PNG from canvas.toDataURL()
  text_memos text,             -- Free text memos
  completed_steps int[] DEFAULT '{}',
  created_at timestamptz DEFAULT now(),
  UNIQUE(student_id, passage_id)
);

CREATE INDEX IF NOT EXISTS student_activities_student_id_idx ON public.student_activities(student_id);
CREATE INDEX IF NOT EXISTS student_activities_passage_id_idx ON public.student_activities(passage_id);

-- ============================================================
-- ROW LEVEL SECURITY
-- ============================================================

-- users: 본인만 조회/수정
ALTER TABLE public.users ENABLE ROW LEVEL SECURITY;
CREATE POLICY "users_self_select" ON public.users FOR SELECT USING (auth.uid() = id);
CREATE POLICY "users_self_update" ON public.users FOR UPDATE USING (auth.uid() = id);

-- passages: 교사는 본인 것만, 학생은 stage_released >= 1인 것만
ALTER TABLE public.passages ENABLE ROW LEVEL SECURITY;
CREATE POLICY "passages_teacher_all" ON public.passages
  FOR ALL USING (auth.uid() = teacher_id);
CREATE POLICY "passages_student_read" ON public.passages
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.teacher_analyses ta
      WHERE ta.passage_id = id AND ta.stage_released >= 1
    )
  );

-- teacher_analyses: 교사는 본인 지문의 분석만, 학생은 stage_released >= 1인 것만 읽기
ALTER TABLE public.teacher_analyses ENABLE ROW LEVEL SECURITY;
CREATE POLICY "analyses_teacher_all" ON public.teacher_analyses
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.passages p
      WHERE p.id = passage_id AND p.teacher_id = auth.uid()
    )
  );
CREATE POLICY "analyses_student_read" ON public.teacher_analyses
  FOR SELECT USING (stage_released >= 1);

-- student_activities: 본인 활동만
ALTER TABLE public.student_activities ENABLE ROW LEVEL SECURITY;
CREATE POLICY "activities_self_all" ON public.student_activities
  FOR ALL USING (auth.uid() = student_id);
-- 교사는 본인 지문의 학생 활동 열람 가능 (비교 뷰용)
CREATE POLICY "activities_teacher_read" ON public.student_activities
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.passages p
      WHERE p.id = passage_id AND p.teacher_id = auth.uid()
    )
  );

-- ============================================================
-- REALTIME
-- ============================================================
-- teacher_analyses 변경을 실시간으로 학생에게 전달
ALTER PUBLICATION supabase_realtime ADD TABLE public.teacher_analyses;
