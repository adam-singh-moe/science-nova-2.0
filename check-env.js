// Quick Environment Check Script
console.log('=== ENVIRONMENT CONFIGURATION CHECK ===\n')

console.log('Required Environment Variables:')
console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL || '❌ MISSING')
console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? '✅ SET' : '❌ MISSING')
console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? '✅ SET' : '❌ MISSING')

console.log('\nOptional Environment Variables:')
console.log('GOOGLE_CLOUD_PROJECT_ID:', process.env.GOOGLE_CLOUD_PROJECT_ID || '⚠️ Not set')
console.log('GOOGLE_APPLICATION_CREDENTIALS:', process.env.GOOGLE_APPLICATION_CREDENTIALS || '⚠️ Not set')

console.log('\n=== STATUS ===')
const hasSupabase = process.env.NEXT_PUBLIC_SUPABASE_URL && 
                   process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY && 
                   process.env.SUPABASE_SERVICE_ROLE_KEY

if (hasSupabase) {
  console.log('✅ Supabase configuration looks good!')
  console.log('Next steps:')
  console.log('1. Test the achievements API: node test-database-setup.js')
  console.log('2. Start the dev server: npm run dev')
  console.log('3. Visit /achievements page and check browser console')
} else {
  console.log('❌ Supabase configuration incomplete!')
  console.log('Required actions:')
  console.log('1. Copy .env.local.template to .env.local')
  console.log('2. Fill in your Supabase credentials from https://app.supabase.com')
  console.log('3. Restart your development server')
  console.log('4. See ACHIEVEMENTS_API_FIX.md for detailed instructions')
}

console.log('\n=== FILES TO CHECK ===')
console.log('Environment file should be: .env.local')
console.log('Template available at: .env.local.template')
console.log('Documentation: ACHIEVEMENTS_API_FIX.md')
