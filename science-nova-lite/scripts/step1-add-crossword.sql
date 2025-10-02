-- STEP 1: Add enum values (run this first, then commit)
-- Run each ALTER TYPE statement separately in Supabase SQL Editor

ALTER TYPE content_subtype ADD VALUE IF NOT EXISTS 'CROSSWORD';