const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function checkDefaultUserCache() {
  try {
    console.log('🔍 Checking cache entries for anonymous users (null user_id)...');
    
    const { data: cacheData, error } = await supabase
      .from('content_cache')
      .select('*')
      .is('user_id', null)
      .order('created_at', { ascending: false });
      
    if (error) {
      console.error('❌ Error fetching cache data:', error);
      return;
    }
    
    console.log(`📚 Found ${cacheData.length} cache entries for anonymous users:`);
    
    if (cacheData.length === 0) {
      console.log('No cache entries found for anonymous users');
      
      // Check what user IDs we actually have
      const { data: userIds, error: userError } = await supabase
        .from('content_cache')
        .select('user_id')
        .order('created_at', { ascending: false })
        .limit(10);
        
      if (!userError && userIds) {
        const uniqueUserIds = [...new Set(userIds.map(entry => entry.user_id))];
        console.log('Available user IDs in cache:', uniqueUserIds);
      }
      
      return;
    }
    
    cacheData.forEach((entry, index) => {
      const hasContent = entry.content && Object.keys(JSON.parse(entry.content)).length > 0;
      const hasImages = entry.image_urls && entry.image_urls.length > 0;
      const imageCount = hasImages ? entry.image_urls.length : 0;
      
      console.log(`${index + 1}. Topic ID: ${entry.topic_id}`);
      console.log(`   User: ${entry.user_id || 'anonymous'}`);
      console.log(`   Created: ${new Date(entry.created_at).toLocaleString()}`);
      console.log(`   Has content: ${hasContent}`);
      console.log(`   Content images: ${entry.content_images ? entry.content_images.length : 0}`);
      console.log(`   Flashcard images: ${entry.flashcard_images ? entry.flashcard_images.length : 0}`);
      console.log(`   Content length: ${entry.content ? entry.content.length : 0} chars`);
      console.log(`   Prompt-only cache: ${entry.generation_metadata?.cached_without_images || false}`);
      console.log('');
    });
    
  } catch (error) {
    console.error('❌ Script error:', error);
  }
}

checkDefaultUserCache();
