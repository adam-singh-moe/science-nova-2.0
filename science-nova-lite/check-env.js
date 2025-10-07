// Environment check and setup for textbook processing
const fs = require('fs')
require('dotenv').config({ path: '.env.local' })

function checkEnvironment() {
  console.log('🔍 Checking Environment Configuration')
  console.log('=' .repeat(50))
  
  const requiredEnvVars = [
    'OPENAI_API_KEY',
    'NEXT_PUBLIC_SUPABASE_URL', 
    'SUPABASE_SERVICE_ROLE_KEY'
  ]
  
  let allPresent = true
  
  requiredEnvVars.forEach(envVar => {
    const value = process.env[envVar]
    if (value) {
      const maskedValue = envVar.includes('KEY') || envVar.includes('SECRET') 
        ? value.substring(0, 8) + '...' + value.substring(value.length - 4)
        : value
      console.log(`✅ ${envVar}: ${maskedValue}`)
    } else {
      console.log(`❌ ${envVar}: NOT SET`)
      allPresent = false
    }
  })
  
  console.log('=' .repeat(50))
  
  if (allPresent) {
    console.log('✅ All required environment variables are set')
    return true
  } else {
    console.log('❌ Missing required environment variables')
    console.log('\\nPlease ensure your .env.local file contains:')
    requiredEnvVars.forEach(envVar => {
      if (!process.env[envVar]) {
        console.log(`${envVar}=your_${envVar.toLowerCase()}_here`)
      }
    })
    return false
  }
}

if (require.main === module) {
  checkEnvironment()
}

module.exports = { checkEnvironment }