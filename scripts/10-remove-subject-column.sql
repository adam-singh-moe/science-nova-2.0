-- Remove subject column and add name column to textbook_uploads table
BEGIN;

-- Drop the subject column and its index
DROP INDEX IF EXISTS idx_textbook_uploads_subject;
ALTER TABLE textbook_uploads DROP COLUMN IF EXISTS subject;

-- Add name column for better file identification
ALTER TABLE textbook_uploads ADD COLUMN IF NOT EXISTS name TEXT NOT NULL DEFAULT '';

-- Create index for name column
CREATE INDEX IF NOT EXISTS idx_textbook_uploads_name ON textbook_uploads(name);

COMMIT;
