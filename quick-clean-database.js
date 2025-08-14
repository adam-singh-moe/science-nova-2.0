require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.SUPABASE_SERVICE_ROLE_KEY);

async function quickClean() {
  console.log('🧹 QUICK DATABASE CLEANUP');
  console.log('=========================\n');
  
  // Clean only the most commonly filled tables
  const quickCleanTables = [
    'content_cache',           // Generated content cache
    'story_image_cache',       // Generated images
    'adventure_completions',   // User progress data
    'daily_adventures',        // Generated adventures
    'user_progress',           // User learning progress
    'ai_chat_logs',           // Chat history
    'textbook_embeddings'     // Cached embeddings
  ];
  
  console.log('📋 Quick clean will target these high-volume tables:');
  quickCleanTables.forEach(table => console.log(`   - ${table}`));
  console.log('');
  
  for (const table of quickCleanTables) {
    try {
      console.log(`🧽 Cleaning ${table}...`);
      
      const { count: beforeCount } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (beforeCount > 0) {
        const { error } = await supabase
          .from(table)
          .delete()
          .neq('id', '00000000-0000-0000-0000-000000000000');
        
        if (error) {
          console.log(`   ❌ Error: ${error.message}`);
        } else {
          console.log(`   ✅ Cleaned ${beforeCount} records`);
        }
      } else {
        console.log(`   ⚪ Already empty`);
      }
      
    } catch (err) {
      console.log(`   ⚪ Table doesn't exist: ${table}`);
    }
  }
  
  console.log('\n✅ Quick cleanup complete!');
  console.log('💡 User profiles and core settings preserved.');
}

// Run quick cleanup
quickClean().catch(console.error);
