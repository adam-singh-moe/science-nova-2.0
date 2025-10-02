# API Endpoints Restructuring Guide

## Overview
This guide shows how to update API endpoints to work with the new dedicated table structure.

## Current vs New API Structure

### Discovery Content APIs

#### Before (topic_content_entries)
```typescript
// OLD: app/api/admin/discovery/route.ts
export async function GET() {
  const { data } = await supabase
    .from('topic_content_entries')
    .select('*, topics(title, grade_level)')
    .eq('category', 'DISCOVERY')
    .order('created_at', { ascending: false });
  
  return Response.json(data);
}
```

#### After (discovery_content)
```typescript
// NEW: app/api/admin/discovery/route.ts
export async function GET() {
  const { data } = await supabase
    .from('discovery_content')
    .select(`
      *,
      topics(title, grade_level)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('discovery_content')
    .insert({
      topic_id: body.topic_id,
      title: body.title,
      fact_text: body.fact_text,
      detail_explanation: body.detail_explanation,
      content_type: body.content_type, // 'fact', 'info', 'concept'
      source_url: body.source_url,
      tags: body.tags || [],
      reading_level: body.reading_level,
      created_by: body.created_by
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data);
}
```

### Arcade Games APIs

#### Before (topic_content_entries)
```typescript
// OLD: app/api/admin/arcade/route.ts
export async function GET() {
  const { data } = await supabase
    .from('topic_content_entries')
    .select('*, topics(title, grade_level)')
    .eq('category', 'ARCADE')
    .order('created_at', { ascending: false });
  
  return Response.json(data);
}
```

#### After (arcade_games)
```typescript
// NEW: app/api/admin/arcade/route.ts
export async function GET() {
  const { data } = await supabase
    .from('arcade_games')
    .select(`
      *,
      topics(title, grade_level)
    `)
    .eq('status', 'published')
    .order('created_at', { ascending: false });
  
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  // Validate game_type
  const validGameTypes = ['quiz', 'crossword', 'wordsearch', 'memory'];
  if (!validGameTypes.includes(body.game_type)) {
    return Response.json(
      { error: `Invalid game type. Must be one of: ${validGameTypes.join(', ')}` },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from('arcade_games')
    .insert({
      topic_id: body.topic_id,
      title: body.title,
      description: body.description,
      game_type: body.game_type,
      game_data: body.game_data, // JSON specific to game type
      difficulty_level: body.difficulty_level || 'medium',
      estimated_play_time: body.estimated_play_time || 5,
      educational_objectives: body.educational_objectives || [],
      created_by: body.created_by
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data);
}
```

### Lessons APIs (New)

```typescript
// NEW: app/api/admin/lessons/route.ts
export async function GET() {
  const { data } = await supabase
    .from('lessons')
    .select(`
      *,
      topics(title, grade_level)
    `)
    .eq('status', 'published')
    .order('topic_id', { ascending: true })
    .order('lesson_order', { ascending: true });
  
  return Response.json(data);
}

export async function POST(request: Request) {
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('lessons')
    .insert({
      topic_id: body.topic_id,
      title: body.title,
      description: body.description,
      lesson_order: body.lesson_order || 1,
      content_blocks: body.content_blocks || [],
      learning_objectives: body.learning_objectives || [],
      key_concepts: body.key_concepts || [],
      vocabulary_terms: body.vocabulary_terms || {},
      estimated_duration: body.estimated_duration || 15,
      prerequisite_lessons: body.prerequisite_lessons || [],
      created_by: body.created_by
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  return Response.json(data);
}
```

### User Activity Tracking APIs (New)

```typescript
// NEW: app/api/user/activity/route.ts
export async function POST(request: Request) {
  const body = await request.json();
  
  const { data, error } = await supabase
    .from('user_activity')
    .insert({
      user_id: body.user_id,
      activity_type: body.activity_type, // e.g., 'discovery_viewed', 'arcade_completed'
      content_type: body.content_type,   // 'discovery', 'arcade', 'lesson'
      content_id: body.content_id,
      topic_id: body.topic_id,
      duration_seconds: body.duration_seconds,
      score: body.score,
      max_possible_score: body.max_possible_score,
      completion_percentage: body.completion_percentage,
      activity_data: body.activity_data || {},
      session_id: body.session_id
    })
    .select()
    .single();

  if (error) {
    return Response.json({ error: error.message }, { status: 400 });
  }

  // Update user topic progress
  await updateUserTopicProgress(body.user_id, body.topic_id, body.activity_type);

  return Response.json(data);
}

// Helper function to update user progress
async function updateUserTopicProgress(userId: string, topicId: string, activityType: string) {
  // Get current progress
  const { data: progress } = await supabase
    .from('user_topic_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('topic_id', topicId)
    .single();

  let updateData: any = {
    last_accessed: new Date().toISOString()
  };

  // Update specific progress counters based on activity type
  switch (activityType) {
    case 'discovery_viewed':
      updateData.discovery_items_viewed = (progress?.discovery_items_viewed || 0) + 1;
      break;
    case 'arcade_completed':
      updateData.arcade_games_played = (progress?.arcade_games_played || 0) + 1;
      break;
    case 'lesson_completed':
      updateData.lessons_completed = (progress?.lessons_completed || 0) + 1;
      break;
  }

  if (progress) {
    await supabase
      .from('user_topic_progress')
      .update(updateData)
      .eq('user_id', userId)
      .eq('topic_id', topicId);
  } else {
    await supabase
      .from('user_topic_progress')
      .insert({
        user_id: userId,
        topic_id: topicId,
        first_accessed: new Date().toISOString(),
        ...updateData
      });
  }
}
```

### Achievements APIs (New)

```typescript
// NEW: app/api/user/achievements/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const userId = searchParams.get('userId');
  
  if (!userId) {
    return Response.json({ error: 'User ID required' }, { status: 400 });
  }

  const { data } = await supabase
    .from('user_achievements')
    .select(`
      *,
      achievements(*)
    `)
    .eq('user_id', userId)
    .order('completion_date', { ascending: false });
  
  return Response.json(data);
}

// Check and award achievements
export async function POST(request: Request) {
  const body = await request.json();
  const { userId, activityType, activityData } = body;
  
  // Get all active achievements for this activity type
  const { data: achievements } = await supabase
    .from('achievements')
    .select('*')
    .eq('is_active', true);
  
  const newAchievements = [];
  
  for (const achievement of achievements || []) {
    const criteria = achievement.criteria;
    
    // Check if user meets criteria
    const meetsRequirement = await checkAchievementCriteria(
      userId, 
      criteria, 
      activityType, 
      activityData
    );
    
    if (meetsRequirement) {
      // Award achievement
      const { data: newAchievement } = await supabase
        .from('user_achievements')
        .upsert({
          user_id: userId,
          achievement_id: achievement.id,
          is_completed: true,
          completion_date: new Date().toISOString(),
          current_progress: criteria.threshold,
          target_progress: criteria.threshold
        })
        .select(`
          *,
          achievements(*)
        `)
        .single();
      
      if (newAchievement) {
        newAchievements.push(newAchievement);
      }
    }
  }
  
  return Response.json({ newAchievements });
}

async function checkAchievementCriteria(
  userId: string, 
  criteria: any, 
  activityType: string, 
  activityData: any
): Promise<boolean> {
  switch (criteria.type) {
    case 'discovery_viewed':
      const { count: discoveryCount } = await supabase
        .from('user_activity')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', 'discovery_viewed');
      return (discoveryCount || 0) >= criteria.threshold;
      
    case 'arcade_completed':
      const { count: arcadeCount } = await supabase
        .from('user_activity')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', userId)
        .eq('activity_type', 'arcade_completed');
      return (arcadeCount || 0) >= criteria.threshold;
      
    // Add more criteria checks as needed
    default:
      return false;
  }
}
```

### Weekly Reports API (New)

```typescript
// NEW: app/api/admin/reports/weekly/route.ts
export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const startDate = searchParams.get('startDate') || new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString();
  const endDate = searchParams.get('endDate') || new Date().toISOString();

  // Get activity summary for the week
  const { data: activitySummary } = await supabase
    .from('user_activity')
    .select(`
      activity_type,
      user_id,
      profiles(full_name, grade_level),
      created_at
    `)
    .gte('created_at', startDate)
    .lte('created_at', endDate);

  // Get achievement completions for the week
  const { data: achievements } = await supabase
    .from('user_achievements')
    .select(`
      *,
      profiles(full_name, grade_level),
      achievements(name, category, difficulty_level)
    `)
    .gte('completion_date', startDate)
    .lte('completion_date', endDate)
    .eq('is_completed', true);

  // Aggregate data
  const report = {
    period: { startDate, endDate },
    totalUsers: new Set(activitySummary?.map(a => a.user_id)).size,
    totalActivities: activitySummary?.length || 0,
    activityBreakdown: {
      discovery: activitySummary?.filter(a => a.activity_type.includes('discovery')).length || 0,
      arcade: activitySummary?.filter(a => a.activity_type.includes('arcade')).length || 0,
      lesson: activitySummary?.filter(a => a.activity_type.includes('lesson')).length || 0
    },
    achievementsEarned: achievements?.length || 0,
    topUsers: getTopUsers(activitySummary || []),
    newAchievements: achievements || []
  };

  return Response.json(report);
}

function getTopUsers(activities: any[]) {
  const userActivityCount = activities.reduce((acc, activity) => {
    acc[activity.user_id] = (acc[activity.user_id] || 0) + 1;
    return acc;
  }, {});

  return Object.entries(userActivityCount)
    .sort(([,a], [,b]) => (b as number) - (a as number))
    .slice(0, 10)
    .map(([userId, count]) => {
      const userActivity = activities.find(a => a.user_id === userId);
      return {
        userId,
        name: userActivity?.profiles?.full_name,
        gradeLevel: userActivity?.profiles?.grade_level,
        activityCount: count
      };
    });
}
```

## Key Changes Summary

1. **Dedicated Tables**: Each content type now has its own table with type-specific fields
2. **Type Safety**: Better validation for game types, content types, and activity types
3. **Activity Tracking**: Comprehensive tracking of all user interactions
4. **Achievement System**: Automated achievement checking and awarding
5. **Progress Tracking**: Detailed progress metrics per topic and content type
6. **Reporting**: Rich analytics and reporting capabilities

This new structure provides much better data organization, performance, and extensibility for your science learning platform.