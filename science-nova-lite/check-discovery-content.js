// Check discovery_content table data
require('dotenv').config({ path: '.env.local' })

const { createClient } = require('@supabase/supabase-js')

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function checkDiscoveryContent() {
  try {
    console.log('🔍 Checking discovery_content table...')
    
    // Get total count
    const { count, error: countError } = await supabase
      .from('discovery_content')
      .select('*', { count: 'exact', head: true })
    
    if (countError) {
      console.error('❌ Error counting discovery_content:', countError)
      return
    }
    
    console.log(`📊 Total rows in discovery_content: ${count}`)
    
    if (count && count > 0) {
      // Get sample data
      const { data: sampleData, error: sampleError } = await supabase
        .from('discovery_content')
        .select('*')
        .limit(3)
      
      if (sampleError) {
        console.error('❌ Error getting sample data:', sampleError)
        return
      }
      
      console.log('\n📋 Sample discovery_content rows:')
      sampleData.forEach((row, i) => {
        console.log(`\nRow ${i + 1}:`)
        Object.keys(row).forEach(key => {
          const value = row[key]
          const truncated = typeof value === 'string' && value.length > 100 
            ? value.substring(0, 100) + '...' 
            : value
          console.log(`  ${key}: ${JSON.stringify(truncated)}`)
        })
      })
      
      // Check content_type distribution
      const { data: contentTypes, error: typesError } = await supabase
        .from('discovery_content')
        .select('content_type')
      
      if (!typesError && contentTypes) {
        const typeDistribution = contentTypes.reduce((acc, item) => {
          const type = item.content_type || 'null'
          acc[type] = (acc[type] || 0) + 1
          return acc
        }, {})
        
        console.log('\n📊 Content type distribution:')
        Object.entries(typeDistribution).forEach(([type, count]) => {
          console.log(`  ${type}: ${count}`)
        })
      }
    }
    
    // Also check if there are any arcade-related tables
    console.log('\n🔍 Checking for arcade-related content...')
    const arcadeTables = ['arcade_content', 'arcade_entries', 'content_entries']
    
    for (const table of arcadeTables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true })
        
        if (!error) {
          console.log(`  ✅ ${table}: ${count} rows`)
          
          if (count && count > 0) {
            const { data: sample } = await supabase
              .from(table)
              .select('*')
              .limit(1)
            
            if (sample && sample.length > 0) {
              console.log(`    Columns: [${Object.keys(sample[0]).join(', ')}]`)
            }
          }
        }
      } catch (e) {
        console.log(`  ❌ ${table}: doesn't exist`)
      }
    }
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

checkDiscoveryContent()