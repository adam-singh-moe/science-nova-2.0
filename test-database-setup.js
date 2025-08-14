#!/usr/bin/env node
require('dotenv').config({ path: '.env.local' })

/**
 * Test script to verify database tables and functions exist
 */

const { createClient } = require('@supabase/supabase-js')

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!SUPABASE_URL || !SUPABASE_SERVICE_KEY) {
  console.error('❌ Missing Supabase configuration')
  console.error('Please set NEXT_PUBLIC_SUPABASE_URL and SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function testDatabase() {
  console.log('🔍 Testing database setup...\n')

  // Test 1: Check if user_progress table exists
  console.log('1. Testing user_progress table...')
  try {
    const { data, error } = await supabase
      .from('user_progress')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ user_progress table error:', error.message)
    } else {
      console.log('✅ user_progress table exists')
    }
  } catch (error) {
    console.log('❌ user_progress table error:', error.message)
  }

  // Test 2: Check if adventure_completions table exists
  console.log('\n2. Testing adventure_completions table...')
  try {
    const { data, error } = await supabase
      .from('adventure_completions')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ adventure_completions table error:', error.message)
      console.log('   Note: This table might not be created yet - that\'s okay!')
    } else {
      console.log('✅ adventure_completions table exists')
    }
  } catch (error) {
    console.log('❌ adventure_completions table error:', error.message)
  }

  // Test 3: Check if story_image_cache table exists
  console.log('\n3. Testing story_image_cache table...')
  try {
    const { data, error } = await supabase
      .from('story_image_cache')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ story_image_cache table error:', error.message)
    } else {
      console.log('✅ story_image_cache table exists')
    }
  } catch (error) {
    console.log('❌ story_image_cache table error:', error.message)
  }

  // Test 4: Check if adventure_image_jobs table exists  
  console.log('\n4. Testing adventure_image_jobs table...')
  try {
    const { data, error } = await supabase
      .from('adventure_image_jobs')
      .select('*')
      .limit(1)
    
    if (error) {
      console.log('❌ adventure_image_jobs table error:', error.message)
    } else {
      console.log('✅ adventure_image_jobs table exists')
    }
  } catch (error) {
    console.log('❌ adventure_image_jobs table error:', error.message)
  }

  // Test 5: Try creating a test job
  console.log('\n5. Testing job creation...')
  try {
    const testJobData = {
      adventure_id: 'test-adventure-' + Date.now(),
      story_pages: [{ id: 'test', backgroundPrompt: 'test prompt' }],
      status: 'pending',
      progress: 0,
      total_images: 1
    }

    const { data: job, error: jobError } = await supabase
      .from('adventure_image_jobs')
      .insert(testJobData)
      .select()
      .single()

    if (jobError) {
      console.log('❌ Job creation failed:', {
        message: jobError.message,
        details: jobError.details,
        hint: jobError.hint,
        code: jobError.code
      })
    } else {
      console.log('✅ Test job created successfully:', job.id)
      
      // Clean up test job
      await supabase
        .from('adventure_image_jobs')
        .delete()
        .eq('id', job.id)
      console.log('🧹 Test job cleaned up')
    }
  } catch (error) {
    console.log('❌ Job creation test error:', error.message)
  }

  // Test 6: Check if get_user_progress_stats function exists
  console.log('\n6. Testing get_user_progress_stats function...')
  try {
    // Use a dummy user ID for testing
    const { data, error } = await supabase
      .rpc('get_user_progress_stats', { user_id: '00000000-0000-0000-0000-000000000000' })
    
    if (error) {
      console.log('❌ get_user_progress_stats function error:', error.message)
      console.log('   Note: This function might not be created yet - that\'s okay!')
    } else {
      console.log('✅ get_user_progress_stats function exists')
    }
  } catch (error) {
    console.log('❌ get_user_progress_stats function error:', error.message)
  }

  // Test 7: Check API endpoints
  console.log('\n7. Testing API endpoints...')
  
  const baseUrl = 'http://localhost:3000'
  
  try {
    const endpoints = [
      '/api/user-progress',
      '/api/achievements',
      '/api/adventure-completion'
    ]

    for (const endpoint of endpoints) {
      try {
        const response = await fetch(`${baseUrl}${endpoint}`)
        if (response.status === 401) {
          console.log(`✅ ${endpoint} - Correctly requires authentication`)
        } else {
          console.log(`⚠️  ${endpoint} - Status: ${response.status}`)
        }
      } catch (error) {
        console.log(`❌ ${endpoint} - Cannot connect (server not running?)`)
      }
    }
  } catch (error) {
    console.log('❌ Cannot test API endpoints - server might not be running')
  }

  console.log('\n📋 Summary:')
  console.log('- If tables/functions show errors, run the SQL scripts in the scripts/ folder')
  console.log('- The APIs are designed to work gracefully even if some tables are missing')
  console.log('- Start with scripts/01-schema-setup.sql to create basic tables')
  console.log('- Then run scripts/16-user-progress-stats.sql and scripts/17-adventure-completions.sql')
}

testDatabase().catch(console.error)
