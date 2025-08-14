# 🚀 Science Nova Environment Setup Guide

## Current Status: ✅ Mostly Complete!

I can see your environment is already well-configured. Here's what you have and what might need attention:

## ✅ Already Configured

### 1. Supabase (Database & Auth)
```bash
NEXT_PUBLIC_SUPABASE_URL=https://dhgfdeoqzxxdgvfirdzf.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJ... (configured)
SUPABASE_SERVICE_ROLE_KEY=eyJ... (configured)
```

### 2. Google AI API
```bash
GOOGLE_GENERATIVE_AI_API_KEY=AIzaSyAT9EiUgfsfmyzjqBM3SIixacWWhX0-ZD4
```

### 3. Google Cloud (Partial)
```bash
GOOGLE_CLOUD_PROJECT_ID=hip-limiter-457816-e7
GOOGLE_CLOUD_PRIVATE_KEY=... (configured)
GOOGLE_CLOUD_CLIENT_EMAIL=science-nova-ai-service@hip-limiter-457816-e7.iam.gserviceaccount.com
```

## 🔧 Setup Steps

### Step 1: Install Dependencies
```powershell
npm install
```

### Step 2: Restart Development Server
Your environment variables exist but need to be loaded:
```powershell
# Stop current server (Ctrl+C if running)
npm run dev
```

### Step 3: Verify Environment Loading
```powershell
node check-env.js
```

### Step 4: Test Database Connection
```powershell
node test-database-setup.js
```

## 🗃️ Database Setup

Your Supabase is configured, but you may need to set up tables:

### Required SQL Scripts (run in Supabase SQL Editor):
1. `scripts/16-user-progress-stats.sql` - User progress tracking
2. `scripts/17-adventure-completions.sql` - Adventure completion tracking  
3. `scripts/18-quick-progress-setup.sql` - Quick setup for all tables

### Run All Scripts:
```sql
-- Copy and paste each script into Supabase SQL Editor
-- Or use the Supabase CLI if configured
```

## 🧪 Testing Your Setup

### Test API Endpoints:
```powershell
# Test user progress API
node debug-user-progress-api.js

# Test achievements API  
node test-api-after-restart.js
```

### Test in Browser:
1. Start dev server: `npm run dev`
2. Visit: http://localhost:3000
3. Check browser console for errors
4. Test authentication flow

## 🚨 Common Issues & Solutions

### Issue: Environment variables not loading
**Solution:** Restart development server
```powershell
# Stop with Ctrl+C, then:
npm run dev
```

### Issue: Database connection errors
**Solution:** Check Supabase credentials and run SQL scripts

### Issue: Authentication failures
**Solution:** Ensure RLS policies are set up (scripts handle this)

## 📁 Project Structure Overview

```
science-nova/
├── .env.local              ✅ Configured
├── package.json            ✅ Dependencies ready
├── app/                    🎯 Next.js 15 App Router
│   ├── api/               📡 API routes
│   ├── achievements/      🏆 Achievements page
│   ├── learning-adventure/🚀 Learning adventures
│   └── topic/[id]/        📚 Topic pages
├── components/            🧩 React components
├── lib/                   🔧 Utilities & config
├── scripts/               📜 Database setup scripts
└── hooks/                 🪝 React hooks
```

## 🎯 Next Steps After Setup

1. **Start Development:**
   ```powershell
   npm run dev
   ```

2. **Visit Your App:**
   - Home: http://localhost:3000
   - Achievements: http://localhost:3000/achievements
   - Admin: http://localhost:3000/admin

3. **Test Core Features:**
   - User authentication
   - Topic browsing
   - Achievement tracking
   - AI chat functionality

## 🆘 Need Help?

Run this for a quick health check:
```powershell
npm run dev
# Then in browser console:
fetch('/api/achievements').then(r => r.json()).then(console.log)
```

Your environment looks great! The main thing you might need is to restart your dev server to load the environment variables properly.
