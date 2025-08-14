-- Insert default study areas
INSERT INTO study_areas (name, vanta_effect, description)
VALUES 
    ('Biology', 'BIRDS', 'The study of living organisms and their interactions with each other and the environment'),
    ('Physics', 'HALO', 'The study of matter, energy, and the fundamental forces of nature'),
    ('Chemistry', 'NET', 'The study of substances, their properties, structure, and the changes they undergo'),
    ('Geology', 'TOPOLOGY', 'The study of the Earth, the materials it is made of, and its structure and processes'),
    ('Meteorology', 'CLOUDS2', 'The study of the atmosphere and weather patterns'),
    ('Astronomy', 'RINGS', 'The study of celestial objects, space, and the physical universe as a whole'),
    ('Anatomy', 'CELLS', 'The study of the structure and organization of living things')
ON CONFLICT (name) DO UPDATE
SET vanta_effect = EXCLUDED.vanta_effect,
    description = EXCLUDED.description;

-- Insert sample textbook content for each study area and grade level
-- Biology Grade 1
INSERT INTO textbook_content (study_area_id, grade_level, title, content, storage_path)
SELECT 
    (SELECT id FROM study_areas WHERE name = 'Biology'),
    1,
    'Living Things',
    'Living things are organisms that have certain characteristics. They grow, need food and water, and can reproduce. Plants and animals are living things. Plants make their own food using sunlight. Animals eat plants or other animals for food.',
    '/Biology/Grade1/living_things.txt'
ON CONFLICT (study_area_id, grade_level, title) DO NOTHING;

-- Physics Grade 3
INSERT INTO textbook_content (study_area_id, grade_level, title, content, storage_path)
SELECT 
    (SELECT id FROM study_areas WHERE name = 'Physics'),
    3,
    'Forces and Motion',
    'Forces can make objects move, stop, or change direction. A push or pull is a force. Gravity is a force that pulls objects toward Earth. Magnets can push or pull without touching. When you kick a ball, you apply a force to make it move.',
    '/Physics/Grade3/forces_and_motion.txt'
ON CONFLICT (study_area_id, grade_level, title) DO NOTHING;

-- Chemistry Grade 5
INSERT INTO textbook_content (study_area_id, grade_level, title, content, storage_path)
SELECT 
    (SELECT id FROM study_areas WHERE name = 'Chemistry'),
    5,
    'States of Matter',
    'Matter exists in three main states: solid, liquid, and gas. Solids have a fixed shape and volume. Liquids have a fixed volume but take the shape of their container. Gases have neither fixed shape nor volume. Matter can change from one state to another when heated or cooled.',
    '/Chemistry/Grade5/states_of_matter.txt'
ON CONFLICT (study_area_id, grade_level, title) DO NOTHING;

-- Astronomy Grade 6
INSERT INTO textbook_content (study_area_id, grade_level, title, content, storage_path)
SELECT 
    (SELECT id FROM study_areas WHERE name = 'Astronomy'),
    6,
    'The Solar System',
    'Our solar system consists of the Sun, eight planets, dwarf planets, moons, asteroids, and comets. The planets in order from the Sun are: Mercury, Venus, Earth, Mars, Jupiter, Saturn, Uranus, and Neptune. Earth is the only known planet with liquid water and life.',
    '/Astronomy/Grade6/solar_system.txt'
ON CONFLICT (study_area_id, grade_level, title) DO NOTHING;

-- Create sample admin user function (to be run manually with specific email)
CREATE OR REPLACE FUNCTION create_sample_admin(admin_email TEXT, admin_name TEXT)
RETURNS void AS $$
DECLARE
    user_id UUID;
BEGIN
    -- Get the user ID from auth.users
    SELECT id INTO user_id FROM auth.users WHERE email = admin_email;
    
    IF user_id IS NULL THEN
        RAISE EXCEPTION 'User with email % not found', admin_email;
    END IF;
    
    -- Insert or update the profile as an admin
    INSERT INTO profiles (id, full_name, role, learning_preference)
    VALUES (user_id, admin_name, 'ADMIN', 'VISUAL')
    ON CONFLICT (id) DO UPDATE
    SET role = 'ADMIN',
        full_name = admin_name;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Example usage:
-- SELECT create_sample_admin('admin@example.com', 'Admin User');
