// Test script for grade-level AI chat functionality
const testAIChatGradeLevels = async () => {
  const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'
  
  // Test cases for different grade levels
  const testCases = [
    {
      grade: 1,
      message: "Why do plants need water?",
      expectedComplexity: "very simple",
      expectedVocabulary: "basic"
    },
    {
      grade: 3, 
      message: "How do magnets work?",
      expectedComplexity: "simple",
      expectedVocabulary: "elementary"
    },
    {
      grade: 6,
      message: "What is photosynthesis?",
      expectedComplexity: "moderate",
      expectedVocabulary: "middle school"
    },
    {
      grade: 9,
      message: "How do chemical bonds form?",
      expectedComplexity: "advanced",
      expectedVocabulary: "high school"
    }
  ]

  console.log("🧪 Testing AI Chat Grade-Level Filtering\n")

  for (const testCase of testCases) {
    console.log(`\n📚 Testing Grade ${testCase.grade}:`)
    console.log(`Question: "${testCase.message}"`)
    
    try {
      const response = await fetch(`${baseUrl}/api/ai-chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: testCase.message,
          userId: 'test-user-id', // This would need to be a real user ID in practice
          gradeLevel: testCase.grade
        })
      })

      if (!response.ok) {
        console.error(`❌ HTTP Error: ${response.status}`)
        continue
      }

      const data = await response.json()
      
      console.log(`✅ Response received:`)
      console.log(`   Grade Level: ${data.gradeLevel}`)
      console.log(`   Textbook Sources: ${data.contentSources}`)
      console.log(`   Content: ${data.response.substring(0, 100)}...`)
      
      // Check if response seems appropriate for grade level
      const responseText = data.response.toLowerCase()
      const wordCount = data.response.split(' ').length
      
      console.log(`   Word Count: ${wordCount}`)
      console.log(`   Expected Complexity: ${testCase.expectedComplexity}`)
      
      // Basic complexity checks
      if (testCase.grade <= 2 && wordCount > 50) {
        console.warn(`⚠️  Response might be too long for Grade ${testCase.grade}`)
      }
      
      if (testCase.grade <= 5 && responseText.includes('molecule')) {
        console.warn(`⚠️  Response might use advanced vocabulary for Grade ${testCase.grade}`)
      }
      
    } catch (error) {
      console.error(`❌ Error testing Grade ${testCase.grade}:`, error.message)
    }
  }

  console.log("\n🎯 Testing Grade-Level Textbook Filtering:")
  
  // Test that higher grade topics are redirected appropriately
  const redirectTest = {
    grade: 2,
    message: "Explain quantum physics",
    shouldRedirect: true
  }
  
  try {
    const response = await fetch(`${baseUrl}/api/ai-chat`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        message: redirectTest.message,
        userId: 'test-user-id',
        gradeLevel: redirectTest.grade
      })
    })

    const data = await response.json()
    console.log(`\nRedirection Test (Grade ${redirectTest.grade} asked about quantum physics):`)
    console.log(`Response: ${data.response.substring(0, 150)}...`)
    
    if (data.response.toLowerCase().includes('quantum')) {
      console.warn(`⚠️  AI may not be properly redirecting advanced topics for young students`)
    } else {
      console.log(`✅ AI properly redirected advanced topic to age-appropriate level`)
    }
    
  } catch (error) {
    console.error(`❌ Error testing topic redirection:`, error.message)
  }

  console.log("\n✨ Grade-level testing complete!")
}

// Run the test if this file is executed directly
if (require.main === module) {
  testAIChatGradeLevels().catch(console.error)
}

module.exports = { testAIChatGradeLevels }
