-- Insert sample data (Optional)
-- Run this ninth to add sample study areas

-- Insert sample study areas
INSERT INTO study_areas (name, vanta_effect, description) VALUES
('Mathematics', 'waves', 'Explore the world of numbers and equations'),
('Science', 'fog', 'Discover how the universe works'),
('Reading', 'birds', 'Journey through stories and literature'),
('Social Studies', 'globe', 'Learn about people and places')
ON CONFLICT (name) DO NOTHING;

-- Confirm setup completion
SELECT 'Database setup complete! All tables, functions, triggers, policies, storage, and indexes created.' as status;
