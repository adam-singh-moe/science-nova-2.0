# Science Nova Lite

A trimmed Next.js app featuring Authentication, Profile, Home (dashboard), Topics, and Achievements. It reuses your existing Supabase backend.

## Features
- Auth (email/password via Supabase)
- Student Profile editor (name, grade level, learning preference)
- Home dashboard (progress, streaks, featured cards)
- Topics (recommended and all topics with filtering)
- Achievements (earned/in-progress)
- API routes: profile, user-progress, generate-enhanced-content, generate-image-enhanced

## Requirements
- Node 18+
- Supabase project (same as main app)

## Environment Variables
Copy `.env.example` to `.env.local` and fill in values:

- NEXT_PUBLIC_SUPABASE_URL
- NEXT_PUBLIC_SUPABASE_ANON_KEY
- SUPABASE_SERVICE_ROLE_KEY (optional; improves caching in API)
- GOOGLE_GENERATIVE_AI_API_KEY (optional; AI content falls back when missing)

## Run
- Install deps and start dev server. Build also works. See package.json scripts.

## Notes
- Image generation returns a fast gradient placeholder and caches prompts. You can later wire a real image model.
- Content generation uses Gemini when `GOOGLE_GENERATIVE_AI_API_KEY` is set; otherwise a safe, deterministic fallback is returned for local dev.
