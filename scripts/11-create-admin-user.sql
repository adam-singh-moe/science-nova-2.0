-- Create an admin user for testing
-- This script should be run in your Supabase SQL editor

-- First, create the user in auth.users (you'll need to do this manually in Supabase Auth)
-- Then update the profile role to ADMIN

-- Update any existing user to be admin (replace the email with your actual test user email)
UPDATE profiles 
SET role = 'ADMIN', full_name = 'Admin User' 
WHERE email = 'admin@test.com';

-- If no user exists, you can insert one after creating the auth user in Supabase
-- INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
-- VALUES ('your-user-id-from-auth', 'admin@test.com', 'Admin User', 'ADMIN', NOW(), NOW());

-- Verify the admin user exists
SELECT id, email, full_name, role FROM profiles WHERE role = 'ADMIN';
