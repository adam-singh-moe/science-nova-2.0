// Script to warm cache for recommended topics
const { createClient } = require('@supabase/supabase-js')

require('dotenv').config({ path: '.env.local' })

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function warmRecommendedTopicsCache() {
  console.log('🔥 Starting recommended topics cache warming...\n')
  
  try {
    // Get all unique grade levels that have topics
    const { data: grades, error: gradesError } = await supabase
      .from('topics')
      .select('grade_level')
      .order('grade_level')
    
    if (gradesError) {
      console.error('❌ Error fetching grade levels:', gradesError)
      return
    }
    
    const uniqueGrades = [...new Set(grades.map(g => g.grade_level))].sort()
    console.log(`📚 Found topics for grades: ${uniqueGrades.join(', ')}`)
    
    for (const gradeLevel of uniqueGrades) {
      console.log(`\n🎯 Warming cache for Grade ${gradeLevel}...`)
      
      try {
        // Get recommended topics for this grade
        const response = await fetch(`http://localhost:3000/api/recommended-topics?gradeLevel=${gradeLevel}&limit=6`)
        
        if (!response.ok) {
          console.error(`❌ Failed to get recommendations for Grade ${gradeLevel}:`, response.statusText)
          continue
        }
        
        const data = await response.json()
        const recommendedTopics = data.recommendedTopics || []
        
        console.log(`✅ Got ${recommendedTopics.length} recommended topics for Grade ${gradeLevel}`)
        
        if (recommendedTopics.length === 0) {
          console.log(`⚠️ No topics recommended for Grade ${gradeLevel}`)
          continue
        }
        
        // Pre-cache these topics
        console.log(`🚀 Pre-caching content for Grade ${gradeLevel} topics...`)
        
        const topicIds = recommendedTopics.map(t => t.id)
        const cacheResponse = await fetch('http://localhost:3000/api/topic-cache', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ 
            topicIds,
            userId: `grade-${gradeLevel}-default`
          }),
        })
        
        if (cacheResponse.ok) {
          const cacheResult = await cacheResponse.json()
          console.log(`✅ Cache warming complete for Grade ${gradeLevel}:`)
          console.log(`   - Total topics: ${cacheResult.summary.total}`)
          console.log(`   - Successfully cached: ${cacheResult.summary.successful}`)
          console.log(`   - Already cached: ${cacheResult.summary.alreadyCached}`)
          console.log(`   - Errors: ${cacheResult.summary.errors}`)
        } else {
          console.error(`❌ Failed to cache topics for Grade ${gradeLevel}:`, cacheResponse.statusText)
        }
        
        // Add delay between grades to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        console.error(`❌ Error warming cache for Grade ${gradeLevel}:`, error)
      }
    }
    
    console.log('\n🎉 Recommended topics cache warming completed!')
    console.log('\n📊 Cache Status Summary:')
    
    // Check final cache status
    const { data: cacheCount } = await supabase
      .from('content_cache')
      .select('topic_id', { count: 'exact', head: true })
    
    console.log(`   - Total cached topics: ${cacheCount?.length || 0}`)
    console.log('   - Users will now experience instant loading for recommended topics!')
    
  } catch (error) {
    console.error('❌ Fatal error in cache warming:', error)
  }
}

// Run the script
if (require.main === module) {
  warmRecommendedTopicsCache().then(() => {
    console.log('\n✅ Cache warming script completed')
    process.exit(0)
  }).catch(error => {
    console.error('\n❌ Cache warming script failed:', error)
    process.exit(1)
  })
}
