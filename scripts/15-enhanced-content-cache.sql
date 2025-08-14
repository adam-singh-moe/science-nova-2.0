-- Enhanced Content Cache Migration
-- Adds support for content with generated images and flashcards

-- Update content_cache table to support enhanced content with images
ALTER TABLE content_cache 
ADD COLUMN IF NOT EXISTS content_images TEXT[], -- Array of content image URLs
ADD COLUMN IF NOT EXISTS flashcard_images TEXT[], -- Array of flashcard cover image URLs  
ADD COLUMN IF NOT EXISTS generation_metadata JSONB, -- Store generation stats
ADD COLUMN IF NOT EXISTS image_generation_time INTEGER, -- Time taken for image generation
ADD COLUMN IF NOT EXISTS content_images_generated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS flashcard_images_generated INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS textbook_references INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS learning_preference TEXT;

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS content_cache_images_idx ON content_cache USING GIN (content_images);
CREATE INDEX IF NOT EXISTS content_cache_metadata_idx ON content_cache USING GIN (generation_metadata);
CREATE INDEX IF NOT EXISTS content_cache_generation_time_idx ON content_cache (created_at, image_generation_time);

-- Add comment explaining the enhanced structure
COMMENT ON TABLE content_cache IS 'Enhanced content cache supporting AI-generated images for lesson content and flashcard covers';
COMMENT ON COLUMN content_cache.content_images IS 'Array of URLs for content section images';
COMMENT ON COLUMN content_cache.flashcard_images IS 'Array of URLs for flashcard cover images';
COMMENT ON COLUMN content_cache.generation_metadata IS 'JSON metadata about content generation including prompts and stats';
COMMENT ON COLUMN content_cache.image_generation_time IS 'Time in milliseconds taken to generate all images';
COMMENT ON COLUMN content_cache.learning_preference IS 'User learning preference used for content generation (STORY, VISUAL, FACTS)';

-- Update RLS policies to handle the new columns (existing policies should still work)
-- The new columns are included automatically in existing SELECT/INSERT/UPDATE policies
