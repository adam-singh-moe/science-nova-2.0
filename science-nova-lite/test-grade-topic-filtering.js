// Test script to verify grade-based topic filtering
const fetch = require('node-fetch')

async function testGradeFiltering() {
  console.log('🧪 Testing grade-based topic filtering...\n')
  
  try {
    // Test all topics
    console.log('📚 Fetching all topics:')
    const allResponse = await fetch('http://localhost:3000/api/topics?limit=50')
    const allTopics = await allResponse.json()
    console.log(`Found ${allTopics.items?.length || 0} total topics`)
    
    if (allTopics.items?.length > 0) {
      console.log('Sample topics:')
      allTopics.items.slice(0, 3).forEach(topic => {
        console.log(`  - ${topic.title} (Grade ${topic.grade_level})`)
      })
    }
    
    // Test grade-specific filtering
    for (let grade = 1; grade <= 6; grade++) {
      console.log(`\n🔍 Testing Grade ${grade} topics:`)
      const gradeResponse = await fetch(`http://localhost:3000/api/topics?limit=50&grade=${grade}`)
      const gradeTopics = await gradeResponse.json()
      
      console.log(`Found ${gradeTopics.items?.length || 0} topics for Grade ${grade}`)
      
      if (gradeTopics.items?.length > 0) {
        gradeTopics.items.slice(0, 2).forEach(topic => {
          console.log(`  - ${topic.title} (Grade ${topic.grade_level})`)
        })
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message)
  }
}

testGradeFiltering()