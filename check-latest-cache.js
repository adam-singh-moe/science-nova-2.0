const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkLatestCache() {
  try {
    console.log('🔍 Checking for cache entries from the last hour...');
    
    // Get cache entries from the last hour
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();
    const { data: cacheData, error } = await supabase
      .from('content_cache')
      .select('*')
      .gte('created_at', oneHourAgo)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Error fetching cache data:', error);
      return;
    }
    
    console.log(`📚 Found ${cacheData.length} cache entries from the last hour:`);
    
    if (cacheData.length === 0) {
      console.log('No recent cache entries found');
      return;
    }
    
    cacheData.forEach((entry, index) => {
      const hasContent = entry.content && Object.keys(JSON.parse(entry.content)).length > 0;
      const hasImages = entry.image_urls && entry.image_urls.length > 0;
      const imageCount = hasImages ? entry.image_urls.length : 0;
      
      console.log(`${index + 1}. Topic ID: ${entry.topic_id}`);
      console.log(`   User: ${entry.user_id || 'N/A'}`);
      console.log(`   Created: ${new Date(entry.created_at).toLocaleString()}`);
      console.log(`   Has content: ${hasContent}`);
      console.log(`   Images: ${imageCount}`);
      
      if (hasContent) {
        const content = JSON.parse(entry.content);
        if (content.flashcards) {
          console.log(`   Flashcards: ${content.flashcards.length}`);
        }
        if (content.quizQuestions) {
          console.log(`   Quiz questions: ${content.quizQuestions.length}`);
        }
      }
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkLatestCache();
