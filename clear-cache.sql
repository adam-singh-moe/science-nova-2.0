-- Clear content cache for testing new content generation
-- Run this SQL in your Supabase SQL editor to clear cached content

-- Clear all cached content to force regeneration with improved HTML rendering
DELETE FROM content_cache;

-- Optional: Clear specific topic content (replace 'your-topic-id' with actual topic ID)
-- DELETE FROM content_cache WHERE topic_id = 'your-topic-id';

-- This will force regeneration of all topic content with:
-- ✅ Fixed HTML rendering (no more raw HTML text)
-- ✅ Better content formatting with proper paragraph breaks
-- ✅ Minimum 3 flashcards and exactly 5 quiz questions
-- ✅ Improved visual elements and image placeholders

-- After running this, visit any topic to see the improvements!
