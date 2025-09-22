# Science Nova Lite Database Setup

This folder contains all the SQL scripts needed to set up a complete Supabase database for the Science Nova Lite application.

## Setup Instructions

Run these scripts **IN ORDER** in your new Supabase project's SQL Editor:

### 1. `01-extensions-and-types.sql`
- Enables required PostgreSQL extensions (uuid-ossp, vector, pgcrypto, pg_trgm)
- Creates custom enum types (user_role, learning_preference)

### 2. `02-create-tables.sql`
- Creates all core database tables
- Sets up relationships with foreign keys
- Includes all tables needed for the application

### 3. `03-create-functions.sql`
- Creates utility functions for timestamps
- Sets up admin helper functions
- Creates search functions for embeddings
- Creates user progress statistics functions

### 4. `04-create-triggers.sql`
- Sets up automatic timestamp updates
- Creates profile creation trigger for new users
- Enables automatic data management

### 5. `05-enable-rls.sql`
- Enables Row Level Security on all tables
- Prepares tables for security policies

### 6. `06-create-policies.sql`
- Creates comprehensive RLS policies
- Ensures users can only access their own data
- Gives admins appropriate permissions

### 7. `07-setup-storage.sql`
- Creates Supabase Storage buckets
- Sets up file upload permissions
- Configures textbook and user upload storage

### 8. `08-create-indexes.sql`
- Creates performance indexes
- Optimizes database queries
- Sets up vector search indexes for embeddings

### 9. `09-sample-data.sql` (Optional)
- Adds sample study areas
- Provides initial data for testing
- Confirms setup completion

## After Running Scripts

1. Update your `.env.local` file with the new Supabase project credentials:
   - `NEXT_PUBLIC_SUPABASE_URL`
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY`
   - `SUPABASE_SERVICE_ROLE_KEY`

2. Test the application to ensure all features work correctly

## Tables Created

- `profiles` - User profiles and roles
- `study_areas` - Subject areas (Math, Science, etc.)
- `topics` - Learning topics within study areas
- `content_cache` - Cached AI-generated content
- `textbook_content` - Reference materials
- `user_progress` - Student progress tracking
- `lessons` - Lesson builder content
- `lesson_activity_events` - Learning analytics
- `daily_adventures` - Adventure story data
- `adventure_completions` - Adventure completion tracking
- `ai_chat_logs` - AI chat history
- `textbook_embeddings` - Vector embeddings for search

## Features Enabled

- ✅ User authentication with automatic profile creation
- ✅ Role-based access control (Student, Teacher, Admin, Developer)
- ✅ Lesson builder with rich content
- ✅ Progress tracking and analytics
- ✅ AI chat with textbook search
- ✅ Adventure story system
- ✅ File upload and storage
- ✅ Vector search for content recommendations
- ✅ Comprehensive security policies
