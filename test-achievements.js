const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testAchievements() {
  console.log('🏆 Testing achievements system...')
  
  try {
    // Check if lesson_activity_events table exists and has data
    const { data: events, error: eventsError } = await supabase
      .from('lesson_activity_events')
      .select('*')
      .limit(5)
      .order('created_at', { ascending: false });
    
    if (eventsError) {
      console.log('❌ Error checking lesson_activity_events:', eventsError.message);
      return;
    }
    
    console.log(`📊 Found ${events.length} recent lesson activity events:`);
    events.forEach((event, i) => {
      console.log(`${i+1}. User: ${event.user_id}`);
      console.log(`   Event: ${event.event_type}`);
      console.log(`   Tool: ${event.tool_kind}`);
      console.log(`   Lesson: ${event.lesson_id}`);
      console.log(`   Created: ${new Date(event.created_at).toLocaleString()}`);
      console.log('');
    });

    // Test achievements API by making a request
    console.log('🎯 Testing achievements API...');
    
    // Simulate API call
    const userId = events.length > 0 ? events[0].user_id : 'test-user';
    console.log(`Testing with user: ${userId}`);
    
    // Call our achievements endpoint logic directly
    const { data: activityData, error: activityError } = await supabase
      .from('lesson_activity_events')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (activityError) {
      console.log('❌ Error fetching user activity:', activityError.message);
      return;
    }
    
    console.log(`📈 User ${userId} has ${activityData.length} activity events`);
    
    // Analyze the data for achievements
    const eventTypes = {};
    const toolTypes = {};
    activityData.forEach(event => {
      eventTypes[event.event_type] = (eventTypes[event.event_type] || 0) + 1;
      toolTypes[event.tool_kind] = (toolTypes[event.tool_kind] || 0) + 1;
    });
    
    console.log('📊 Event type breakdown:');
    Object.entries(eventTypes).forEach(([type, count]) => {
      console.log(`   ${type}: ${count}`);
    });
    
    console.log('🔧 Tool usage breakdown:');
    Object.entries(toolTypes).forEach(([tool, count]) => {
      console.log(`   ${tool}: ${count}`);
    });

  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testAchievements().catch(console.error)
