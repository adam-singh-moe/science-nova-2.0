// Create image cache tables in Supabase database
require('dotenv').config({ path: '.env.local' })
const { createClient } = require('@supabase/supabase-js')
const fs = require('fs')

async function createImageCacheTables() {
  console.log('🗄️ Creating Image Cache Tables...\n')

  try {
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )

    console.log('✅ Supabase client created successfully')

    // Create tables directly using SQL
    console.log('🔄 Creating story_image_cache table...')
    
    const createCacheTableSQL = `
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
      CREATE INDEX IF NOT EXISTS idx_story_image_cache_created_at ON story_image_cache(created_at);
    `
    
    try {
      const { error: cacheError } = await supabase.rpc('exec_sql', { sql: createCacheTableSQL })
      if (cacheError) {
        console.log('❌ Failed to create story_image_cache:', cacheError.message)
        // Try alternative approach - create table using raw query
        console.log('🔄 Trying alternative approach...')
        
        const { error: altError } = await supabase
          .from('_supabase_admin')
          .select('*')
          .limit(0) // This will fail but we can catch SQL creation errors
        
      } else {
        console.log('✅ story_image_cache table created')
      }
    } catch (error) {
      console.log('⚠️ Direct SQL execution not available, checking if table exists...')
    }

    console.log('🔄 Creating adventure_image_jobs table...')
    
    const createJobsTableSQL = `
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
    
    try {
      const { error: jobsError } = await supabase.rpc('exec_sql', { sql: createJobsTableSQL })
      if (jobsError) {
        console.log('❌ Failed to create adventure_image_jobs:', jobsError.message)
      } else {
        console.log('✅ adventure_image_jobs table created')
      }
    } catch (error) {
      console.log('⚠️ Direct SQL execution not available for jobs table')
    }

    console.log('\n🧪 Testing table creation...')
    
    // Test if tables now exist
    const { data: cacheData, error: cacheError } = await supabase
      .from('story_image_cache')
      .select('count(*)')
      .limit(1)
    
    if (cacheError) {
      console.log('❌ story_image_cache still not accessible:', cacheError.message)
    } else {
      console.log('✅ story_image_cache table created successfully')
    }

    const { data: jobsData, error: jobsError } = await supabase
      .from('adventure_image_jobs')
      .select('count(*)')
      .limit(1)
    
    if (jobsError) {
      console.log('❌ adventure_image_jobs still not accessible:', jobsError.message)
    } else {
      console.log('✅ adventure_image_jobs table created successfully')
    }

  } catch (error) {
    console.error('💥 Failed to create tables:', error)
  }
}

createImageCacheTables()
