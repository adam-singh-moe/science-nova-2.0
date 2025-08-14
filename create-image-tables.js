const { createClient } = require('@supabase/supabase-js');
require('dotenv').config();

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createImageCacheTables() {
  try {
    console.log('📊 Creating story_image_cache table...');
    
    // Create the story_image_cache table
    const { error: cacheError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS story_image_cache (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          prompt_hash TEXT NOT NULL UNIQUE,
          original_prompt TEXT NOT NULL,
          enhanced_prompt TEXT NOT NULL,
          image_data TEXT NOT NULL,
          image_type TEXT DEFAULT 'ai-generated',
          generation_time_ms INTEGER,
          aspect_ratio TEXT DEFAULT '16:9',
          grade_level INTEGER,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          last_used_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          usage_count INTEGER DEFAULT 1
        );
        
        CREATE INDEX IF NOT EXISTS idx_story_image_cache_prompt_hash ON story_image_cache(prompt_hash);
        CREATE INDEX IF NOT EXISTS idx_story_image_cache_grade_level ON story_image_cache(grade_level);
      `
    });

    if (cacheError) {
      console.error('❌ Error creating cache table:', cacheError);
    } else {
      console.log('✅ Cache table created successfully');
    }

    console.log('📊 Creating adventure_image_jobs table...');
    
    // Create the adventure_image_jobs table
    const { error: jobsError } = await supabase.rpc('exec', {
      sql: `
        CREATE TABLE IF NOT EXISTS adventure_image_jobs (
          id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
          adventure_id UUID NOT NULL,
          story_pages JSONB NOT NULL,
          status TEXT DEFAULT 'pending',
          progress INTEGER DEFAULT 0,
          total_images INTEGER DEFAULT 0,
          error_message TEXT,
          created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
          completed_at TIMESTAMP WITH TIME ZONE
        );
        
        CREATE INDEX IF NOT EXISTS idx_adventure_image_jobs_adventure_id ON adventure_image_jobs(adventure_id);
        CREATE INDEX IF NOT EXISTS idx_adventure_image_jobs_status ON adventure_image_jobs(status);
      `
    });

    if (jobsError) {
      console.error('❌ Error creating jobs table:', jobsError);
    } else {
      console.log('✅ Jobs table created successfully');
    }

    console.log('🎉 Image cache system tables ready!');
    
  } catch (error) {
    console.error('❌ Error creating tables:', error);
  }
}

createImageCacheTables();
