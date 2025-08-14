-- Image cache table to store generated AI images
CREATE TABLE IF NOT EXISTS story_image_cache (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  prompt_hash TEXT NOT NULL UNIQUE, -- SHA-256 hash of the enhanced prompt
  original_prompt TEXT NOT NULL,
  enhanced_prompt TEXT NOT NULL,
  image_data TEXT NOT NULL, -- Base64 encoded image data
  image_type TEXT DEFAULT 'ai-generated', -- 'ai-generated', 'gradient', etc.
  generation_time_ms INTEGER, -- Time taken to generate
  aspect_ratio TEXT DEFAULT '16:9',
  grade_level INTEGER,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  usage_count INTEGER DEFAULT 1
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_story_image_cache_prompt_hash ON story_image_cache(prompt_hash);
CREATE INDEX IF NOT EXISTS idx_story_image_cache_grade_level ON story_image_cache(grade_level);
CREATE INDEX IF NOT EXISTS idx_story_image_cache_created_at ON story_image_cache(created_at);

-- Adventure image generation jobs table
CREATE TABLE IF NOT EXISTS adventure_image_jobs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  adventure_id UUID NOT NULL,
  story_pages JSONB NOT NULL, -- Array of page data with prompts
  status TEXT DEFAULT 'pending', -- 'pending', 'processing', 'completed', 'failed'
  progress INTEGER DEFAULT 0, -- Number of images generated
  total_images INTEGER DEFAULT 0, -- Total images to generate
  error_message TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Index for job status lookups
CREATE INDEX IF NOT EXISTS idx_adventure_image_jobs_adventure_id ON adventure_image_jobs(adventure_id);
CREATE INDEX IF NOT EXISTS idx_adventure_image_jobs_status ON adventure_image_jobs(status);

-- Update function for updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger for adventure_image_jobs
DROP TRIGGER IF EXISTS update_adventure_image_jobs_updated_at ON adventure_image_jobs;
CREATE TRIGGER update_adventure_image_jobs_updated_at
    BEFORE UPDATE ON adventure_image_jobs
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- Cleanup old cache entries (optional - run periodically)
-- DELETE FROM story_image_cache WHERE created_at < NOW() - INTERVAL '30 days' AND usage_count < 5;
