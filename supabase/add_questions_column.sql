-- Add questions column to passages table
-- Run this in Supabase SQL Editor

ALTER TABLE public.passages ADD COLUMN IF NOT EXISTS questions text;
