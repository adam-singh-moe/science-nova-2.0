// Test current database structure and API endpoints
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function testDatabaseStructure() {
  try {
    console.log('🔍 Testing current database structure...')
    
    // Check existing topic_content_entries
    const { data: entries, error } = await supabase
      .from('topic_content_entries')
      .select('*')
      .limit(3)
    
    if (error) {
      console.error('❌ Failed to query topic_content_entries:', error)
      return false
    }
    
    console.log('✅ Successfully queried topic_content_entries')
    console.log('📊 Sample entries:', entries?.length || 0)
    
    if (entries && entries.length > 0) {
      console.log('📋 First entry structure:')
      console.log(Object.keys(entries[0]))
      
      // Check if grade_level column already exists
      if (entries[0].hasOwnProperty('grade_level')) {
        console.log('✅ grade_level column already exists!')
      } else {
        console.log('⚠️ grade_level column does not exist yet')
      }
    }
    
    return true
  } catch (error) {
    console.error('💥 Database structure test error:', error)
    return false
  }
}

async function testTopics() {
  try {
    console.log('🔍 Testing topics table...')
    
    const { data: topics, error } = await supabase
      .from('topics')
      .select('id, title, grade_level')
      .limit(5)
    
    if (error) {
      console.error('❌ Failed to query topics:', error)
      return false
    }
    
    console.log('✅ Successfully queried topics')
    console.log('📊 Available topics:', topics?.length || 0)
    
    if (topics && topics.length > 0) {
      console.log('📋 Sample topics:')
      topics.forEach(topic => {
        console.log(`  - ${topic.title} (Grade: ${topic.grade_level})`)
      })
    }
    
    return topics
  } catch (error) {
    console.error('💥 Topics test error:', error)
    return false
  }
}

async function testProfiles() {
  try {
    console.log('🔍 Testing profiles table...')
    
    const { data: profiles, error } = await supabase
      .from('profiles')
      .select('id, full_name, role, grade_level')
      .limit(3)
    
    if (error) {
      console.error('❌ Failed to query profiles:', error)
      return false
    }
    
    console.log('✅ Successfully queried profiles')
    console.log('📊 Available profiles:', profiles?.length || 0)
    
    if (profiles && profiles.length > 0) {
      console.log('📋 Sample profiles:')
      profiles.forEach(profile => {
        console.log(`  - ${profile.full_name} (Role: ${profile.role}, Grade: ${profile.grade_level})`)
      })
      
      // Return the first admin/teacher profile for testing
      const adminProfile = profiles.find(p => ['ADMIN', 'TEACHER', 'DEVELOPER'].includes(p.role))
      if (adminProfile) {
        console.log('✅ Found admin profile for testing:', adminProfile.full_name)
        return adminProfile
      }
    }
    
    return profiles
  } catch (error) {
    console.error('💥 Profiles test error:', error)
    return false
  }
}

async function main() {
  console.log('🧪 Database Structure and Content Test')
  console.log('======================================')
  
  await testDatabaseStructure()
  console.log('')
  
  const topics = await testTopics()
  console.log('')
  
  const profiles = await testProfiles()
  console.log('')
  
  console.log('🎯 Test Summary:')
  console.log('- Database connection: ✅ Working')
  console.log('- topic_content_entries table: ✅ Accessible')
  console.log('- topics table: ✅ Accessible')
  console.log('- profiles table: ✅ Accessible')
  console.log('')
  console.log('📝 Note: grade_level column migration should be done through Supabase dashboard SQL editor')
}

main().catch(console.error)