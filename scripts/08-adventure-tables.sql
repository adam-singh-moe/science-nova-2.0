-- Create daily adventures table
CREATE TABLE IF NOT EXISTS daily_adventures (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    date DATE NOT NULL,
    adventures JSONB NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, date)
);

-- Enable RLS
ALTER TABLE daily_adventures ENABLE ROW LEVEL SECURITY;

-- Create policies
CREATE POLICY "Users can view their own adventures" ON daily_adventures
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert their own adventures" ON daily_adventures
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own adventures" ON daily_adventures
    FOR UPDATE USING (auth.uid() = user_id);
