const { createClient } = require('@supabase/supabase-js')

// Load environment variables from .env.local
require('dotenv').config({ path: '.env.local' })

// Create Supabase client
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY

const supabase = createClient(supabaseUrl, supabaseServiceKey)

async function testNewAchievements() {
  console.log('🏆 Testing new achievements implementation...')
  
  try {
    const testUserId = 'f073aeb6-aebe-4e7b-8ab7-4f5c38e23333';
    
    // Fetch activity data
    const { data: activityData, error: activityError } = await supabase
      .from('lesson_activity_events')
      .select('*')
      .eq('user_id', testUserId)
      .order('created_at', { ascending: false })
      .limit(1000);
    
    if (activityError) {
      console.log('❌ Error fetching activity data:', activityError.message);
      return;
    }
    
    console.log(`📊 Analyzing ${activityData.length} events for user ${testUserId}`);
    
    // Simulate the achievement calculation logic
    const agg = {
      quizResets: 0,
      explanationViews: 0,
      quizScores: [],
      sessionSubjects: new Set(),
      consecutiveStudyDays: 0,
      deepDiveMinutes: 0,
      lowScoreContinuation: 0,
      sameTimeStudySessions: {}
    };
    
    // Process events
    let lastDate = null;
    let consecutiveDays = 0;
    let currentSessionStart = null;
    let sessionMinutes = 0;
    
    activityData.forEach(event => {
      const eventDate = new Date(event.created_at).toDateString();
      const eventHour = new Date(event.created_at).getHours();
      
      // Track consecutive study days
      if (lastDate && lastDate !== eventDate) {
        const dayDiff = Math.abs(new Date(eventDate) - new Date(lastDate)) / (1000 * 60 * 60 * 24);
        if (dayDiff === 1) {
          consecutiveDays++;
        } else {
          consecutiveDays = 1;
        }
        agg.consecutiveStudyDays = Math.max(agg.consecutiveStudyDays, consecutiveDays);
      } else if (!lastDate) {
        consecutiveDays = 1;
        agg.consecutiveStudyDays = 1;
      }
      lastDate = eventDate;
      
      // Track session subjects (mock subject detection)
      if (event.lesson_id) {
        agg.sessionSubjects.add(`subject_${event.lesson_id.slice(0, 8)}`);
      }
      
      // Track quiz events
      if (event.event_type === 'quiz_reset') {
        agg.quizResets++;
      }
      if (event.event_type === 'explanation_view') {
        agg.explanationViews++;
      }
      if (event.event_type === 'quiz_submit' && event.data) {
        try {
          const data = typeof event.data === 'string' ? JSON.parse(event.data) : event.data;
          if (data.pct !== undefined) {
            agg.quizScores.push(data.pct);
          }
        } catch {}
      }
      
      // Track study time consistency
      agg.sameTimeStudySessions[eventHour] = (agg.sameTimeStudySessions[eventHour] || 0) + 1;
      
      // Track deep dive minutes (lesson_heartbeat events)
      if (event.event_type === 'lesson_heartbeat') {
        sessionMinutes++;
      }
    });
    
    agg.deepDiveMinutes = sessionMinutes; // Rough estimate
    
    // Analyze for new achievements
    console.log('\n🎯 Achievement Analysis:');
    
    // 1. Quiz Master Pro
    const avgScore = agg.quizScores.length > 0 ? 
      agg.quizScores.reduce((a, b) => a + b, 0) / agg.quizScores.length : 0;
    const quizMasterPro = agg.quizScores.length >= 10 && avgScore >= 85;
    console.log(`Quiz Master Pro: ${quizMasterPro ? '✅' : '❌'} (${agg.quizScores.length} quizzes, ${avgScore.toFixed(1)}% avg)`);
    
    // 2. Learning Phoenix
    const learningPhoenix = agg.quizResets >= 3;
    console.log(`Learning Phoenix: ${learningPhoenix ? '✅' : '❌'} (${agg.quizResets} quiz resets)`);
    
    // 3. Subject Explorer
    const subjectExplorer = agg.sessionSubjects.size >= 5;
    console.log(`Subject Explorer: ${subjectExplorer ? '✅' : '❌'} (${agg.sessionSubjects.size} subjects)`);
    
    // 4. Detective Scholar
    const detectiveScholar = agg.explanationViews >= 20;
    console.log(`Detective Scholar: ${detectiveScholar ? '✅' : '❌'} (${agg.explanationViews} explanation views)`);
    
    // 5. Consistency Champion
    const consistencyChampion = agg.consecutiveStudyDays >= 7;
    console.log(`Consistency Champion: ${consistencyChampion ? '✅' : '❌'} (${agg.consecutiveStudyDays} consecutive days)`);
    
    // 6. Deep Dive Scholar
    const deepDiveScholar = agg.deepDiveMinutes >= 120;
    console.log(`Deep Dive Scholar: ${deepDiveScholar ? '✅' : '❌'} (${agg.deepDiveMinutes} minutes)`);
    
    // 7. Resilient Learner
    const resilientLearner = agg.lowScoreContinuation >= 3;
    console.log(`Resilient Learner: ${resilientLearner ? '✅' : '❌'} (${agg.lowScoreContinuation} low score continuations)`);
    
    // 8. Time Keeper
    const maxSameTime = Math.max(...Object.values(agg.sameTimeStudySessions));
    const timeKeeper = maxSameTime >= 5;
    console.log(`Time Keeper: ${timeKeeper ? '✅' : '❌'} (${maxSameTime} sessions at same time)`);
    
    console.log('\n📈 Summary:');
    console.log(`- Total quiz scores: ${agg.quizScores.length}`);
    console.log(`- Quiz resets: ${agg.quizResets}`);
    console.log(`- Explanation views: ${agg.explanationViews}`);
    console.log(`- Subjects explored: ${agg.sessionSubjects.size}`);
    console.log(`- Consecutive study days: ${agg.consecutiveStudyDays}`);
    console.log(`- Deep dive minutes: ${agg.deepDiveMinutes}`);
    console.log(`- Study time consistency: ${maxSameTime} sessions at peak hour`);
    
    // Now test the actual API endpoint
    console.log('\n🔥 Testing live achievements API...');
    
    const response = await fetch(`http://localhost:3000/api/achievements?userId=${testUserId}`);
    if (response.ok) {
      const achievements = await response.json();
      console.log('✅ API Response received');
      console.log(`📊 Total achievements: ${achievements.length}`);
      
      // Check for our new achievements
      const newAchievements = [
        'quiz-master-pro', 'learning-phoenix', 'subject-explorer', 
        'detective-scholar', 'consistency-champion', 'deep-dive-scholar',
        'resilient-learner', 'time-keeper'
      ];
      
      newAchievements.forEach(id => {
        const achievement = achievements.find(a => a.id === id);
        if (achievement) {
          console.log(`✅ ${achievement.title}: ${achievement.unlocked ? 'UNLOCKED' : 'Locked'} (${achievement.progress}%)`);
        } else {
          console.log(`❌ ${id}: Not found in API response`);
        }
      });
      
    } else {
      console.log('❌ API call failed:', response.status, response.statusText);
    }
    
  } catch (err) {
    console.log('❌ Error:', err.message);
  }
}

testNewAchievements().catch(console.error)
