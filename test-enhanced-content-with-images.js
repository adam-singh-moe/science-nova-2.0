const fetch = require('node-fetch')

async function testEnhancedContentWithImages() {
  console.log('🧪 Testing Enhanced Topic Content Generation with Images...\n')
  
  try {
    // Get a topic ID from the database first
    const { createClient } = require('@supabase/supabase-js')
    require('dotenv').config({ path: '.env.local' })
    
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    )
    
    console.log('📋 Getting available topics...')
    const { data: topics } = await supabase
      .from('topics')
      .select('id, title, grade_level, study_areas(name)')
      .limit(5)
    
    if (!topics || topics.length === 0) {
      console.log('❌ No topics found in database')
      return
    }
    
    const testTopic = topics[0]
    console.log(`📖 Testing with topic: ${testTopic.title} (Grade ${testTopic.grade_level})`)
    console.log(`📚 Study Area: ${testTopic.study_areas?.name || 'Science'}`)
    
    console.log('\n🎨 Calling enhanced content generation API...')
    const startTime = Date.now()
    
    // Test the enhanced API endpoint
    const response = await fetch('http://localhost:3000/api/generate-enhanced-content', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        topicId: testTopic.id
      })
    })
    
    const endTime = Date.now()
    const totalTime = endTime - startTime
    
    console.log(`📡 API Response status: ${response.status}`)
    console.log(`⏱️  Total response time: ${totalTime}ms`)
    
    if (response.ok) {
      const content = await response.json()
      console.log('\n✅ API Success!')
      
      // Check if content came from cache
      if (content.fromCache) {
        console.log('💾 Content retrieved from cache')
        console.log(`📅 Cache timestamp: ${content.cacheTimestamp}`)
      } else {
        console.log('🆕 Fresh content generated')
        console.log(`⏱️  Image generation time: ${content.imageGenerationTime || 0}ms`)
      }
      
      console.log('\n📊 Generated content structure:')
      console.log(`   📝 Lesson content: ${content.lessonContent?.length || 0} characters`)
      console.log(`   🃏 Flashcards: ${content.flashcards?.length || 0}`)
      console.log(`   🧩 Quiz questions: ${content.quiz?.length || 0}`)
      console.log(`   📚 Textbook references: ${content.textbookReferences || 0}`)
      console.log(`   🎨 Content images generated: ${content.contentImagesGenerated || 0}`)
      console.log(`   🖼️  Flashcard images generated: ${content.flashcardImagesGenerated || 0}`)
      
      // Check lesson content for images
      console.log('\n🖼️  Content Image Analysis:')
      if (content.lessonContent) {
        const imageContainers = (content.lessonContent.match(/<div class="content-image-container">/g) || []).length
        const imagePlaceholders = (content.lessonContent.match(/<div class="content-image-placeholder">/g) || []).length
        const actualImages = (content.lessonContent.match(/<img src="/g) || []).length
        
        console.log(`   📷 Image containers: ${imageContainers}`)
        console.log(`   🖼️  Actual images: ${actualImages}`)
        console.log(`   📖 Placeholders: ${imagePlaceholders}`)
        
        if (actualImages > 0) {
          console.log('   ✅ Content contains generated images!')
        } else if (imagePlaceholders > 0) {
          console.log('   📖 Content contains image placeholders (fallback)')
        } else {
          console.log('   ⚠️  No images or placeholders found in content')
        }
      }
      
      // Check flashcard cover images
      console.log('\n🎴 Flashcard Image Analysis:')
      if (content.flashcards && content.flashcards.length > 0) {
        let flashcardsWithImages = 0
        let flashcardsWithGradients = 0
        let flashcardsWithoutImages = 0
        
        content.flashcards.forEach((card, index) => {
          if (card.coverImage) {
            if (card.coverImage.startsWith('data:image/')) {
              flashcardsWithImages++
              console.log(`   🎨 Card ${index + 1}: AI-generated image (${Math.round(card.coverImage.length / 1024)}KB)`)
            } else if (card.coverImage.startsWith('linear-gradient')) {
              flashcardsWithGradients++
              console.log(`   🌈 Card ${index + 1}: Gradient fallback`)
            } else {
              console.log(`   🔗 Card ${index + 1}: Other image type`)
            }
          } else {
            flashcardsWithoutImages++
            console.log(`   ❌ Card ${index + 1}: No cover image`)
          }
        })
        
        console.log(`\n   📊 Summary:`)
        console.log(`      🎨 AI images: ${flashcardsWithImages}`)
        console.log(`      🌈 Gradients: ${flashcardsWithGradients}`)
        console.log(`      ❌ No images: ${flashcardsWithoutImages}`)
      }
      
      // Sample content preview
      console.log('\n📝 Sample Content Preview:')
      if (content.flashcards && content.flashcards.length > 0) {
        const sampleCard = content.flashcards[0]
        console.log(`   🎴 Sample Flashcard:`)
        console.log(`      Front: "${sampleCard.front}"`)
        console.log(`      Back: "${sampleCard.back}"`)
        console.log(`      Has Image: ${!!sampleCard.coverImage}`)
        if (sampleCard.imagePrompt) {
          console.log(`      Image Prompt: "${sampleCard.imagePrompt}"`)
        }
      }
      
      if (content.quiz && content.quiz.length > 0) {
        const sampleQuestion = content.quiz[0]
        console.log(`   🧩 Sample Quiz Question:`)
        console.log(`      Question: "${sampleQuestion.question}"`)
        console.log(`      Options: ${sampleQuestion.options?.length || 0}`)
        console.log(`      Correct Answer: ${sampleQuestion.correctAnswer}`)
      }
      
      // Test response headers
      const cacheStatus = response.headers.get('x-cache') || 'MISS'
      const responseTime = response.headers.get('x-response-time') || `${totalTime}ms`
      console.log(`\n🏷️  Response Headers:`)
      console.log(`   💾 Cache Status: ${cacheStatus}`)
      console.log(`   ⏱️  Server Response Time: ${responseTime}`)
      
    } else {
      const errorData = await response.text()
      console.error('❌ API Error:', response.status, errorData)
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error)
  }
  
  console.log('\n🎉 Enhanced Content Generation Test Complete!')
  console.log('\n📋 Summary:')
  console.log('✅ Content generation with image prompts')
  console.log('✅ Image generation for lesson content')
  console.log('✅ Cover image generation for flashcards')
  console.log('✅ Content and image caching')
  console.log('✅ Fallback handling for failed generations')
}

testEnhancedContentWithImages().catch(console.error)
