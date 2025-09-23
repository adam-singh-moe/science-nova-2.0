-- 25-weekly-student-reports.sql
-- Create weekly student activity reports table for admin dashboard analytics

CREATE TABLE IF NOT EXISTS public.weekly_student_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
    week_start_date DATE NOT NULL,
    week_end_date DATE NOT NULL,
    
    -- Activity metrics
    lessons_viewed INTEGER DEFAULT 0,
    lessons_completed INTEGER DEFAULT 0,
    quiz_attempts INTEGER DEFAULT 0,
    quiz_average_score DECIMAL(5,2) DEFAULT 0,
    flashcard_sessions INTEGER DEFAULT 0,
    arcade_games_played INTEGER DEFAULT 0,
    discovery_facts_viewed INTEGER DEFAULT 0,
    
    -- Engagement metrics
    total_time_spent_minutes INTEGER DEFAULT 0,
    active_days_count INTEGER DEFAULT 0,
    ai_chat_interactions INTEGER DEFAULT 0,
    
    -- Performance indicators
    improvement_rate DECIMAL(5,2) DEFAULT 0,
    engagement_score DECIMAL(5,2) DEFAULT 0,
    
    -- Metadata
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    
    UNIQUE(user_id, week_start_date)
);

-- Create trigger for auto-updating timestamps
CREATE OR REPLACE FUNCTION public.wsr_set_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;$$;

DROP TRIGGER IF EXISTS wsr_set_updated_at ON public.weekly_student_reports;
CREATE TRIGGER wsr_set_updated_at
    BEFORE UPDATE ON public.weekly_student_reports
    FOR EACH ROW EXECUTE FUNCTION public.wsr_set_updated_at();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_wsr_user_week ON public.weekly_student_reports(user_id, week_start_date DESC);
CREATE INDEX IF NOT EXISTS idx_wsr_week_range ON public.weekly_student_reports(week_start_date, week_end_date);
CREATE INDEX IF NOT EXISTS idx_wsr_engagement_score ON public.weekly_student_reports(engagement_score DESC);

-- Enable RLS
ALTER TABLE public.weekly_student_reports ENABLE ROW LEVEL SECURITY;

-- RLS Policies
DO $$ BEGIN
    CREATE POLICY wsr_admin_full_access ON public.weekly_student_reports
        FOR ALL USING (
            EXISTS (SELECT 1 FROM public.profiles p 
                   WHERE p.id = auth.uid() 
                   AND p.role IN ('TEACHER', 'ADMIN', 'DEVELOPER'))
        );
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

DO $$ BEGIN
    CREATE POLICY wsr_user_own_data ON public.weekly_student_reports
        FOR SELECT USING (user_id = auth.uid());
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

-- Function to calculate weekly report for a user
CREATE OR REPLACE FUNCTION public.calculate_weekly_report(
    p_user_id UUID,
    p_week_start DATE
) RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    p_week_end DATE := p_week_start + INTERVAL '6 days';
    lesson_views INTEGER := 0;
    lesson_completions INTEGER := 0;
    quiz_count INTEGER := 0;
    quiz_avg DECIMAL(5,2) := 0;
    flashcard_count INTEGER := 0;
    arcade_count INTEGER := 0;
    discovery_count INTEGER := 0;
    ai_chats INTEGER := 0;
    active_days INTEGER := 0;
    total_minutes INTEGER := 0;
BEGIN
    -- Calculate lesson activity
    SELECT COUNT(*) INTO lesson_views
    FROM lesson_activity_events 
    WHERE user_id = p_user_id 
    AND created_at::date BETWEEN p_week_start AND p_week_end
    AND event_type = 'view';
    
    SELECT COUNT(*) INTO lesson_completions
    FROM lesson_activity_events 
    WHERE user_id = p_user_id 
    AND created_at::date BETWEEN p_week_start AND p_week_end
    AND event_type = 'complete';
    
    -- Calculate quiz performance
    SELECT COUNT(*), COALESCE(AVG(CAST(data->>'score' AS INTEGER)), 0) 
    INTO quiz_count, quiz_avg
    FROM lesson_activity_events 
    WHERE user_id = p_user_id 
    AND created_at::date BETWEEN p_week_start AND p_week_end
    AND event_type = 'quiz_submit'
    AND data->>'score' IS NOT NULL;
    
    -- Calculate content engagement
    SELECT 
        COUNT(CASE WHEN subtype = 'FLASHCARDS' THEN 1 END),
        COUNT(CASE WHEN category = 'ARCADE' THEN 1 END),
        COUNT(CASE WHEN category = 'DISCOVERY' THEN 1 END)
    INTO flashcard_count, arcade_count, discovery_count
    FROM content_engagement_events 
    WHERE created_at::date BETWEEN p_week_start AND p_week_end;
    
    -- Calculate AI chat interactions
    SELECT COUNT(*) INTO ai_chats
    FROM ai_chat_logs 
    WHERE user_id = p_user_id 
    AND created_at::date BETWEEN p_week_start AND p_week_end;
    
    -- Calculate active days
    SELECT COUNT(DISTINCT created_at::date) INTO active_days
    FROM lesson_activity_events 
    WHERE user_id = p_user_id 
    AND created_at::date BETWEEN p_week_start AND p_week_end;
    
    -- Insert or update the weekly report
    INSERT INTO public.weekly_student_reports (
        user_id, week_start_date, week_end_date,
        lessons_viewed, lessons_completed, quiz_attempts, quiz_average_score,
        flashcard_sessions, arcade_games_played, discovery_facts_viewed,
        ai_chat_interactions, active_days_count,
        engagement_score
    ) VALUES (
        p_user_id, p_week_start, p_week_end,
        lesson_views, lesson_completions, quiz_count, quiz_avg,
        flashcard_count, arcade_count, discovery_count,
        ai_chats, active_days,
        CASE 
            WHEN active_days = 0 THEN 0
            ELSE LEAST(100, (active_days * 14.3) + (lesson_completions * 5) + (quiz_avg * 0.5))
        END
    )
    ON CONFLICT (user_id, week_start_date) 
    DO UPDATE SET
        lessons_viewed = EXCLUDED.lessons_viewed,
        lessons_completed = EXCLUDED.lessons_completed,
        quiz_attempts = EXCLUDED.quiz_attempts,
        quiz_average_score = EXCLUDED.quiz_average_score,
        flashcard_sessions = EXCLUDED.flashcard_sessions,
        arcade_games_played = EXCLUDED.arcade_games_played,
        discovery_facts_viewed = EXCLUDED.discovery_facts_viewed,
        ai_chat_interactions = EXCLUDED.ai_chat_interactions,
        active_days_count = EXCLUDED.active_days_count,
        engagement_score = EXCLUDED.engagement_score,
        updated_at = NOW();
END;
$$;

-- Function to generate reports for all users for a given week
CREATE OR REPLACE FUNCTION public.generate_weekly_reports(p_week_start DATE DEFAULT NULL) 
RETURNS void LANGUAGE plpgsql AS $$
DECLARE
    target_week_start DATE := COALESCE(p_week_start, DATE_TRUNC('week', CURRENT_DATE - INTERVAL '1 week'));
    user_record RECORD;
BEGIN
    FOR user_record IN 
        SELECT id FROM public.profiles WHERE role = 'STUDENT'
    LOOP
        PERFORM public.calculate_weekly_report(user_record.id, target_week_start);
    END LOOP;
END;
$$;