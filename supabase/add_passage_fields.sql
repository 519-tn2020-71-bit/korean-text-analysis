-- 수능특강 세트 구조를 위한 passages 테이블 컬럼 추가
-- Supabase SQL Editor에서 실행하세요

ALTER TABLE passages ADD COLUMN IF NOT EXISTS paragraph_summaries jsonb DEFAULT '[]';
ALTER TABLE passages ADD COLUMN IF NOT EXISTS content_summary     text;
ALTER TABLE passages ADD COLUMN IF NOT EXISTS explanations        text;
