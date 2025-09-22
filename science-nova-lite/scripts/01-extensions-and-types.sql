-- Enable necessary extensions and create types
-- Run this first to set up the foundation

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pgcrypto;
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Create enum types
CREATE TYPE user_role AS ENUM ('STUDENT', 'TEACHER', 'ADMIN', 'DEVELOPER');
CREATE TYPE learning_preference AS ENUM ('STORY', 'VISUAL', 'FACTS');
