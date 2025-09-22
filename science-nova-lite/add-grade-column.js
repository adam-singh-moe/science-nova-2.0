const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function addGradeLevelColumn() {
  console.log('Adding grade_level column to topic_content_entries...\n');
  
  try {
    // First, check if column already exists
    const { data: columns } = await supabase
      .rpc('get_table_columns', { table_name: 'topic_content_entries' })
      .then(res => res)
      .catch(() => ({ data: null }));
    
    // Check existing columns the simple way
    const { data: sample } = await supabase
      .from('topic_content_entries')
      .select('*')
      .limit(1);
    
    if (sample && sample[0] && 'grade_level' in sample[0]) {
      console.log('✅ grade_level column already exists');
    } else {
      console.log('📝 Adding grade_level column...');
      
      // Add the column (this might not work with RLS, so we'll handle it differently)
      const { error: addColumnError } = await supabase
        .rpc('execute_sql', { 
          query: 'ALTER TABLE topic_content_entries ADD COLUMN IF NOT EXISTS grade_level INTEGER;' 
        })
        .then(res => res)
        .catch(() => ({ error: 'RPC not available' }));
        
      if (addColumnError) {
        console.log('⚠️  Cannot add column via API (requires direct database access)');
        console.log('Please run this SQL manually in your database:');
        console.log(`
ALTER TABLE topic_content_entries 
ADD COLUMN IF NOT EXISTS grade_level INTEGER;

CREATE INDEX IF NOT EXISTS idx_topic_content_entries_grade_level 
ON topic_content_entries(grade_level);

ALTER TABLE topic_content_entries 
ADD CONSTRAINT IF NOT EXISTS check_grade_level_range 
CHECK (grade_level IS NULL OR (grade_level >= 1 AND grade_level <= 12));
        `);
        return;
      }
      
      console.log('✅ Column added successfully');
    }
    
    // Update existing content to inherit grade levels from topics
    console.log('📋 Updating existing content with topic grade levels...');
    
    const { data: contentToUpdate } = await supabase
      .from('topic_content_entries')
      .select(`
        id,
        topic_id,
        topics!inner(grade_level)
      `)
      .is('grade_level', null);
    
    if (contentToUpdate && contentToUpdate.length > 0) {
      console.log(`Found ${contentToUpdate.length} entries to update`);
      
      for (const entry of contentToUpdate) {
        const { error } = await supabase
          .from('topic_content_entries')
          .update({ grade_level: entry.topics.grade_level })
          .eq('id', entry.id);
          
        if (error) {
          console.error(`Error updating entry ${entry.id}:`, error.message);
        }
      }
      
      console.log('✅ Updated existing entries with topic grade levels');
    } else {
      console.log('✅ All entries already have grade levels assigned');
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

addGradeLevelColumn();