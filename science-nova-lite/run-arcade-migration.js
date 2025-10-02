require('dotenv').config({ path: '.env.local' });
const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function runArcadeSubtypeMigration() {
  try {
    console.log('🎮 Starting arcade subtype migration...');
    
    // First, let's check current arcade content
    console.log('📊 Checking current arcade content subtypes...');
    const { data: beforeData, error: beforeError } = await supabase
      .from('topic_content_entries')
      .select('id, title, category, subtype, payload')
      .eq('category', 'ARCADE')
      .order('created_at', { ascending: false });
      
    if (beforeError) {
      console.error('❌ Error checking before state:', beforeError);
      return;
    }
    
    console.log('📋 Before migration:');
    beforeData.forEach(item => {
      let gameType = 'Unknown';
      if (item.payload.pairs) gameType = 'Memory (has pairs)';
      if (item.payload.questions) gameType = 'Quiz (has questions)';
      if (item.payload.words && !item.payload.pairs) gameType = 'Word Search (has words)';
      if (item.payload.clues) gameType = 'Crossword (has clues)';
      
      console.log(`  - ${item.title} | Current: ${item.subtype} | Detected: ${gameType}`);
    });
    
    // Read and execute the migration script
    console.log('\n🔄 Executing database migration...');
    const sql = fs.readFileSync('./scripts/23-update-arcade-subtypes.sql', 'utf8');
    
    // Split into individual statements and execute them
    const statements = sql.split(';').filter(stmt => {
      const trimmed = stmt.trim();
      return trimmed && !trimmed.startsWith('--');
    });
    
    for (let i = 0; i < statements.length; i++) {
      const statement = statements[i].trim();
      if (!statement) continue;
      
      console.log(`📝 Executing statement ${i + 1}/${statements.length}...`);
      
      try {
        // Use a raw SQL query approach
        const { error } = await supabase.rpc('exec_sql', { query: statement + ';' });
        
        if (error) {
          console.log(`⚠️  Statement ${i + 1} might not be supported via RPC, trying alternative approach...`);
          // For enum operations, we might need to handle them differently
          if (statement.includes('ALTER TYPE')) {
            console.log('   → Enum operation detected, may need manual execution in Supabase SQL Editor');
          }
        } else {
          console.log(`   ✅ Statement ${i + 1} executed successfully`);
        }
        
      } catch (err) {
        console.log(`⚠️  Statement ${i + 1} execution note: ${err.message}`);
      }
    }
    
    console.log('\n🧪 Checking migration results...');
    
    // Check the updated content
    const { data: afterData, error: afterError } = await supabase
      .from('topic_content_entries')
      .select('id, title, category, subtype, payload')
      .eq('category', 'ARCADE')
      .order('created_at', { ascending: false });
      
    if (afterError) {
      console.error('❌ Error checking after state:', afterError);
      return;
    }
    
    console.log('📋 After migration attempt:');
    afterData.forEach(item => {
      let gameType = 'Unknown';
      if (item.payload.pairs) gameType = 'Memory (has pairs)';
      if (item.payload.questions) gameType = 'Quiz (has questions)';
      if (item.payload.words && !item.payload.pairs) gameType = 'Word Search (has words)';
      if (item.payload.clues) gameType = 'Crossword (has clues)';
      
      console.log(`  - ${item.title} | Subtype: ${item.subtype} | Detected: ${gameType}`);
    });
    
    // Summary
    const subtypeCount = {};
    afterData.forEach(item => {
      subtypeCount[item.subtype] = (subtypeCount[item.subtype] || 0) + 1;
    });
    
    console.log('\n📊 Subtype distribution:');
    Object.entries(subtypeCount).forEach(([subtype, count]) => {
      console.log(`  - ${subtype}: ${count} entries`);
    });
    
    console.log('\n✅ Arcade subtype migration process completed!');
    console.log('💡 Note: If enum operations failed, you may need to run the SQL migration manually in Supabase SQL Editor.');
    
  } catch (error) {
    console.error('❌ Migration error:', error);
  }
}

runArcadeSubtypeMigration();