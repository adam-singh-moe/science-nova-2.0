# ACHIEVEMENTS API TROUBLESHOOTING GUIDE

## Issue: Empty Error `{}` when fetching achievements

### Root Cause
The achievements API is returning a 401 Unauthorized error because Supabase environment variables are not configured.

### Solution Steps

#### 1. Configure Environment Variables
1. Copy `.env.local.template` to `.env.local`:
   ```powershell
   Copy-Item .env.local.template .env.local
   ```

2. Edit `.env.local` and fill in your Supabase credentials:
   - Go to your Supabase dashboard (https://app.supabase.com)
   - Navigate to Settings > API
   - Copy the following values:
     - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
     - **anon/public key** → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
     - **service_role key** → `SUPABASE_SERVICE_ROLE_KEY`

#### 2. Set Up Database Tables
Run the SQL setup scripts in your Supabase SQL editor:

1. **User Progress Tables:**
   ```sql
   -- Run scripts/16-user-progress-stats.sql
   -- Run scripts/17-adventure-completions.sql
   -- Run scripts/18-quick-progress-setup.sql
   ```

2. **Verify setup:**
   ```powershell
   node test-database-setup.js
   ```

#### 3. Restart Development Server
After configuring environment variables:
```powershell
# Stop the current server (Ctrl+C)
# Then restart:
npm run dev
```

#### 4. Test Authentication
1. Make sure you can log in to the app
2. Visit `/achievements` page
3. Check browser console for any remaining errors

### Debugging Steps

#### Check Environment Variables
```powershell
node -e "
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL);
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'Set' : 'Missing');
"
```

#### Test API Directly (when logged in)
Open browser console on the app and run:
```javascript
fetch('/api/achievements', {
  credentials: 'include'
}).then(r => r.json()).then(console.log).catch(console.error)
```

#### Check Server Logs
Look for detailed error messages in the terminal where you're running `npm run dev`.

### Common Error Messages and Solutions

| Error | Solution |
|-------|----------|
| `401 Unauthorized` | Check environment variables and user authentication |
| `Missing Supabase configuration` | Set up `.env.local` file |
| `Table doesn't exist` | Run SQL setup scripts |
| `Network error` | Check if dev server is running on port 3000 |

### Expected Behavior After Fix
- Achievements page loads without errors
- Shows real user progress data
- Displays earned and unearned achievements
- Progress bars reflect actual completion status

### Files Modified for Better Error Handling
- `components/pages/achievements-page.tsx` - Added detailed error logging and user feedback
- `app/api/achievements/route.ts` - Enhanced error handling with fallbacks
- Created `.env.local.template` - Environment configuration template
- This troubleshooting guide

### Next Steps After Resolution
1. Test all achievement scenarios (earning new achievements)
2. Verify topic completion tracking works
3. Test adventure completion tracking
4. Monitor console for any remaining warnings
