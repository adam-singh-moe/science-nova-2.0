-- Create textbook_uploads table to track uploaded textbooks
BEGIN;

-- Create textbook uploads table
CREATE TABLE IF NOT EXISTS textbook_uploads (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL UNIQUE,
  file_size BIGINT NOT NULL,
  grade_level INTEGER NOT NULL CHECK (grade_level >= 1 AND grade_level <= 12),
  description TEXT,
  uploaded_by UUID REFERENCES profiles(id) ON DELETE SET NULL,
  processed BOOLEAN DEFAULT FALSE,
  processing_started_at TIMESTAMPTZ,
  processing_completed_at TIMESTAMPTZ,
  processing_error TEXT,
  chunks_created INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_textbook_uploads_grade_level ON textbook_uploads(grade_level);
CREATE INDEX IF NOT EXISTS idx_textbook_uploads_uploaded_by ON textbook_uploads(uploaded_by);
CREATE INDEX IF NOT EXISTS idx_textbook_uploads_processed ON textbook_uploads(processed);
CREATE INDEX IF NOT EXISTS idx_textbook_uploads_created_at ON textbook_uploads(created_at);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_textbook_uploads_updated_at 
    BEFORE UPDATE ON textbook_uploads 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Enable RLS
ALTER TABLE textbook_uploads ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Admins can view all textbook uploads" ON textbook_uploads
  FOR SELECT USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE POLICY "Admins can insert textbook uploads" ON textbook_uploads
  FOR INSERT WITH CHECK (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE POLICY "Admins can update textbook uploads" ON textbook_uploads
  FOR UPDATE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );

CREATE POLICY "Admins can delete textbook uploads" ON textbook_uploads
  FOR DELETE USING (
    (SELECT role FROM profiles WHERE id = auth.uid()) = 'ADMIN'
  );

COMMIT;
