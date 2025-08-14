-- Insert sample topics (to be run after creating an admin user)
-- Replace 'ADMIN_USER_ID' with the actual UUID of an admin user

-- Function to create sample topics
CREATE OR REPLACE FUNCTION create_sample_topics(admin_id UUID)
RETURNS void AS $$
BEGIN
    -- Biology topics
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Plants and Their Parts',
        1,
        id,
        'Focus on basic plant parts like roots, stems, leaves, and flowers. Include simple explanations of what each part does.',
        admin_id
    FROM study_areas WHERE name = 'Biology'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Animal Habitats',
        2,
        id,
        'Explain different types of habitats (forests, oceans, deserts) and how animals adapt to live in them.',
        admin_id
    FROM study_areas WHERE name = 'Biology'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Life Cycles',
        3,
        id,
        'Cover the life cycles of butterflies, frogs, and plants with emphasis on metamorphosis and growth stages.',
        admin_id
    FROM study_areas WHERE name = 'Biology'
    ON CONFLICT DO NOTHING;
    
    -- Physics topics
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Push and Pull Forces',
        1,
        id,
        'Explain basic forces with everyday examples like pushing a swing or pulling a wagon.',
        admin_id
    FROM study_areas WHERE name = 'Physics'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Simple Machines',
        3,
        id,
        'Cover levers, pulleys, inclined planes, and wheels with examples from daily life.',
        admin_id
    FROM study_areas WHERE name = 'Physics'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Electricity and Circuits',
        5,
        id,
        'Explain how electricity flows in circuits, what conductors and insulators are, and how to build a simple circuit.',
        admin_id
    FROM study_areas WHERE name = 'Physics'
    ON CONFLICT DO NOTHING;
    
    -- Chemistry topics
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'States of Matter',
        2,
        id,
        'Explain solids, liquids, and gases with everyday examples like ice, water, and steam.',
        admin_id
    FROM study_areas WHERE name = 'Chemistry'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Mixtures and Solutions',
        4,
        id,
        'Explain the difference between mixtures and solutions with examples like trail mix vs. salt water.',
        admin_id
    FROM study_areas WHERE name = 'Chemistry'
    ON CONFLICT DO NOTHING;
    
    -- Astronomy topics
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'The Sun, Moon, and Stars',
        1,
        id,
        'Explain basic concepts about the sun, moon, and stars in simple terms for young learners.',
        admin_id
    FROM study_areas WHERE name = 'Astronomy'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Our Solar System',
        4,
        id,
        'Cover the planets in our solar system, their order from the sun, and basic facts about each one.',
        admin_id
    FROM study_areas WHERE name = 'Astronomy'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Space Exploration',
        6,
        id,
        'Cover the history of space exploration, important missions, and how astronauts live in space.',
        admin_id
    FROM study_areas WHERE name = 'Astronomy'
    ON CONFLICT DO NOTHING;
    
    -- Geology topics
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Rocks and Minerals',
        3,
        id,
        'Explain the difference between rocks and minerals, and cover the three main types of rocks.',
        admin_id
    FROM study_areas WHERE name = 'Geology'
    ON CONFLICT DO NOTHING;
    
    -- Meteorology topics
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'Weather Patterns',
        2,
        id,
        'Explain different types of weather, seasons, and how to read simple weather symbols.',
        admin_id
    FROM study_areas WHERE name = 'Meteorology'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'The Water Cycle',
        3,
        id,
        'Explain evaporation, condensation, precipitation, and collection with simple diagrams and examples.',
        admin_id
    FROM study_areas WHERE name = 'Meteorology'
    ON CONFLICT DO NOTHING;
    
    -- Anatomy topics
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'My Five Senses',
        1,
        id,
        'Explain the five senses (sight, hearing, touch, taste, smell) and their corresponding body parts.',
        admin_id
    FROM study_areas WHERE name = 'Anatomy'
    ON CONFLICT DO NOTHING;
    
    INSERT INTO topics (title, grade_level, study_area_id, admin_prompt, creator_id)
    SELECT 
        'The Human Body Systems',
        5,
        id,
        'Cover the main body systems (digestive, respiratory, circulatory, skeletal, muscular) and how they work together.',
        admin_id
    FROM study_areas WHERE name = 'Anatomy'
    ON CONFLICT DO NOTHING;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage:
-- SELECT create_sample_topics('your-admin-uuid-here');
