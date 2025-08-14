require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function testCacheInsert() {
  try {
    console.log('🧪 Testing cache insert...');
    
    const testData = {
      topic_id: '8898c8e9-842f-46e4-87a9-413f11a8cbb7',
      user_id: 'f073aeb6-aebe-4e7b-8ab7-4f5c38e23333',
      content: JSON.stringify({ test: 'data' }),
      content_images: [],
      flashcard_images: [],
      generation_metadata: {
        test: true,
        cached_without_images: true
      },
      image_generation_time: 1000,
      content_images_generated: 0,
      flashcard_images_generated: 0,
      textbook_references: 1,
      learning_preference: 'VISUAL'
    };

    const { data, error } = await supabase
      .from('content_cache')
      .insert(testData);

    if (error) {
      console.log('❌ Insert failed:', error);
      console.log('Error details:', {
        message: error.message,
        code: error.code,
        details: error.details,
        hint: error.hint
      });
    } else {
      console.log('✅ Insert successful:', data);
    }
  } catch (error) {
    console.error('Catch error:', error);
  }
}

testCacheInsert();
