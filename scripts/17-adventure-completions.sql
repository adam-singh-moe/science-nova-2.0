-- Create adventure_completions table to track when users complete adventure stories
CREATE TABLE IF NOT EXISTS adventure_completions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    adventure_id TEXT NOT NULL,
    adventure_title TEXT,
    completed_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, adventure_id)
);

-- Enable RLS
ALTER TABLE adventure_completions ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own adventure completions" ON adventure_completions
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adventure completions" ON adventure_completions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_adventure_completions_user_id ON adventure_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_adventure_completions_completed_at ON adventure_completions(completed_at);
