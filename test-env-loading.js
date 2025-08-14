// Test environment loading with dotenv
const path = require('path')
const fs = require('fs')

console.log('=== ENVIRONMENT LOADING TEST ===\n')

// Check if .env.local exists
const envPath = path.join(__dirname, '.env.local')
console.log('Looking for .env.local at:', envPath)
console.log('File exists:', fs.existsSync(envPath))

if (fs.existsSync(envPath)) {
  console.log('\nFile contents preview:')
  const content = fs.readFileSync(envPath, 'utf-8')
  const lines = content.split('\n').slice(0, 10) // First 10 lines
  lines.forEach((line, i) => {
    if (line.trim() && !line.startsWith('#')) {
      const [key] = line.split('=')
      console.log(`${i + 1}: ${key}=...`)
    } else {
      console.log(`${i + 1}: ${line}`)
    }
  })
}

// Try to manually load environment
try {
  require('dotenv').config({ path: envPath })
  console.log('\n=== AFTER MANUAL LOADING ===')
  console.log('NEXT_PUBLIC_SUPABASE_URL:', process.env.NEXT_PUBLIC_SUPABASE_URL ? 'SET' : 'MISSING')
  console.log('NEXT_PUBLIC_SUPABASE_ANON_KEY:', process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY ? 'SET' : 'MISSING')
  console.log('SUPABASE_SERVICE_ROLE_KEY:', process.env.SUPABASE_SERVICE_ROLE_KEY ? 'SET' : 'MISSING')
} catch (error) {
  console.log('\nCould not load with dotenv:', error.message)
  console.log('This is normal if dotenv is not installed')
}

console.log('\n=== SOLUTION ===')
console.log('The Next.js dev server needs to be restarted to pick up .env.local changes')
console.log('1. Stop the dev server (Ctrl+C in the terminal where it\'s running)')
console.log('2. Restart with: npm run dev')
console.log('3. Test the achievements page again')
