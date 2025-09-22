-- 20-seed-arcade-discovery-content.sql
-- Idempotent seed script for initial Arcade + Discovery content.
-- Run AFTER tables & enums (scripts 17-19). Safe to re-run; it checks for existing rows.

DO $$
DECLARE
  v_creator UUID;
  v_study_area UUID;
  v_topic_arcade UUID;
  v_topic_discovery UUID;
BEGIN
  -- Pick an existing privileged profile (ADMIN / DEVELOPER / TEACHER) to own seeded content
  SELECT id INTO v_creator
  FROM profiles
  WHERE role IN ('ADMIN','DEVELOPER','TEACHER')
  ORDER BY created_at
  LIMIT 1;

  IF v_creator IS NULL THEN
    RAISE NOTICE 'No admin/teacher/developer profile found; skipping seed.';
    RETURN;
  END IF;

  -- Ensure a study area exists
  SELECT id INTO v_study_area FROM study_areas WHERE name = 'General Science';
  IF v_study_area IS NULL THEN
    INSERT INTO study_areas(name, vanta_effect, description)
    VALUES ('General Science','globe','General seeded study area')
    RETURNING id INTO v_study_area;
  END IF;

  -- Create / fetch topics (Grade 5 examples)
  SELECT id INTO v_topic_arcade FROM topics WHERE title = 'Solar System Basics';
  IF v_topic_arcade IS NULL THEN
    INSERT INTO topics(title, grade_level, study_area_id, admin_prompt, creator_id)
    VALUES ('Solar System Basics', 5, v_study_area, 'Seed prompt for solar system arcade items', v_creator)
    RETURNING id INTO v_topic_arcade;
  END IF;

  SELECT id INTO v_topic_discovery FROM topics WHERE title = 'Earth & Ocean Facts';
  IF v_topic_discovery IS NULL THEN
    INSERT INTO topics(title, grade_level, study_area_id, admin_prompt, creator_id)
    VALUES ('Earth & Ocean Facts', 5, v_study_area, 'Seed prompt for discovery facts', v_creator)
    RETURNING id INTO v_topic_discovery;
  END IF;

  -------------------------------------------------------------------
  -- Discovery (FACT / INFO) entries
  -------------------------------------------------------------------
  IF NOT EXISTS (
      SELECT 1 FROM topic_content_entries
      WHERE topic_id = v_topic_discovery AND category='DISCOVERY' AND subtype='FACT' AND title='Deep Ocean Trench'
  ) THEN
    INSERT INTO topic_content_entries(topic_id, category, subtype, title, payload, status, created_by, ai_generated)
    VALUES (
      v_topic_discovery,
      'DISCOVERY','FACT','Deep Ocean Trench',
      jsonb_build_object(
        'preview','The Mariana Trench plunges nearly 11 km below sea level…',
        'text','The Mariana Trench is the deepest known part of the global ocean.',
        'detail','At Challenger Deep it reaches ~10,984 meters. Pressure there is over 1,000x surface pressure; only specialized submersibles have visited.',
        'source','https://oceanexplorer.noaa.gov',
        'points', jsonb_build_array('~11 km deep','>1,000x surface pressure','Life adapted to darkness')
      ),
      'published', v_creator, true
    );
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM topic_content_entries
      WHERE topic_id = v_topic_discovery AND category='DISCOVERY' AND subtype='FACT' AND title='Coral Reef Biodiversity'
  ) THEN
    INSERT INTO topic_content_entries(topic_id, category, subtype, title, payload, status, created_by, ai_generated)
    VALUES (
      v_topic_discovery,
      'DISCOVERY','FACT','Coral Reef Biodiversity',
      jsonb_build_object(
        'preview','Coral reefs host ~25% of marine species while <1% of seafloor…',
        'text','Coral reefs are biodiversity hotspots.',
        'detail','Their complex calcium carbonate structures create numerous micro‑habitats for fish, invertebrates, algae and microbes.',
        'source','https://www.noaa.gov',
        'points', jsonb_build_array('High biodiversity','Habitat complexity','Sensitive to warming')
      ),
      'published', v_creator, true
    );
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM topic_content_entries
      WHERE topic_id = v_topic_discovery AND category='DISCOVERY' AND subtype='INFO' AND title='Ocean Oxygen Production'
  ) THEN
    INSERT INTO topic_content_entries(topic_id, category, subtype, title, payload, status, created_by, ai_generated)
    VALUES (
      v_topic_discovery,
      'DISCOVERY','INFO','Ocean Oxygen Production',
      jsonb_build_object(
        'preview','Tiny phytoplankton power a large share of Earth''s oxygen…',
        'text','Phytoplankton perform massive global photosynthesis.',
        'detail','Seasonal blooms draw down CO2 and release oxygen, influencing climate and supporting marine food webs.',
        'points', jsonb_build_array('Carbon cycle impact','Feed zooplankton','Visible via satellite')
      ),
      'published', v_creator, true
    );
  END IF;

  -------------------------------------------------------------------
  -- Arcade (QUIZ / FLASHCARDS / GAME)
  -------------------------------------------------------------------
  IF NOT EXISTS (
      SELECT 1 FROM topic_content_entries
      WHERE topic_id = v_topic_arcade AND category='ARCADE' AND subtype='QUIZ' AND title='Planets Quick Quiz'
  ) THEN
    INSERT INTO topic_content_entries(topic_id, category, subtype, title, payload, status, created_by, ai_generated)
    VALUES (
      v_topic_arcade,
      'ARCADE','QUIZ','Planets Quick Quiz',
      jsonb_build_object(
        'questions', jsonb_build_array(
          jsonb_build_object('stem','Which planet is known as the Red Planet?','choices', jsonb_build_array(
            jsonb_build_object('text','Mars','correct',true),
            jsonb_build_object('text','Venus'),
            jsonb_build_object('text','Mercury')
          )),
          jsonb_build_object('stem','Largest planet in our solar system?','choices', jsonb_build_array(
            jsonb_build_object('text','Jupiter','correct',true),
            jsonb_build_object('text','Saturn'),
            jsonb_build_object('text','Neptune')
          ))
        )
      ),
      'published', v_creator, true
    );
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM topic_content_entries
      WHERE topic_id = v_topic_arcade AND category='ARCADE' AND subtype='FLASHCARDS' AND title='Planet Flashcards'
  ) THEN
    INSERT INTO topic_content_entries(topic_id, category, subtype, title, payload, status, created_by, ai_generated)
    VALUES (
      v_topic_arcade,
      'ARCADE','FLASHCARDS','Planet Flashcards',
      jsonb_build_object(
        'cards', jsonb_build_array(
          jsonb_build_object('front','Mercury','back','Smallest planet; closest to the Sun'),
            jsonb_build_object('front','Venus','back','Thick atmosphere; hottest surface'),
            jsonb_build_object('front','Jupiter','back','Gas giant with Great Red Spot')
        )
      ),
      'published', v_creator, true
    );
  END IF;

  IF NOT EXISTS (
      SELECT 1 FROM topic_content_entries
      WHERE topic_id = v_topic_arcade AND category='ARCADE' AND subtype='GAME' AND title='Mini Crossword: Planets'
  ) THEN
    INSERT INTO topic_content_entries(topic_id, category, subtype, title, payload, status, created_by, ai_generated)
    VALUES (
      v_topic_arcade,
      'ARCADE','GAME','Mini Crossword: Planets',
      jsonb_build_object(
        'type','CROSSWORD',
        'grid', jsonb_build_array(
          jsonb_build_array('M','A','R','S'),
          jsonb_build_array(' ', 'E',' ',' '),
          jsonb_build_array('J','U','P','I'),
          jsonb_build_array(' ',' ','T',' ')
        ),
        'clues', jsonb_build_object(
          'across', jsonb_build_array('1. Red planet','3. Giant with Red Spot'),
          'down', jsonb_build_array('1. First letter of largest planet (J)','2. Second planet letter (A)')
        )
      ),
      'published', v_creator, true
    );
  END IF;

  RAISE NOTICE 'Seed script executed.';
END $$;
