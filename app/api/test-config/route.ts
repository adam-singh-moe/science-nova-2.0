import { type NextRequest, NextResponse } from "next/server"

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID
const PRIVATE_KEY = process.env.GOOGLE_CLOUD_PRIVATE_KEY
const CLIENT_EMAIL = process.env.GOOGLE_CLOUD_CLIENT_EMAIL

function isGoogleCloudConfigured(): boolean {
  const hasValidProjectId = !!(PROJECT_ID && PROJECT_ID !== 'your-project-id')
  const hasValidPrivateKey = !!(PRIVATE_KEY && !PRIVATE_KEY.includes('your-private-key'))
  const hasValidEmail = !!(CLIENT_EMAIL && CLIENT_EMAIL !== 'your-service-account@your-project.iam.gserviceaccount.com')
  
  console.log('Credential check:')
  console.log('- PROJECT_ID valid:', hasValidProjectId, PROJECT_ID)
  console.log('- PRIVATE_KEY valid:', hasValidPrivateKey, PRIVATE_KEY?.substring(0, 50) + '...')
  console.log('- CLIENT_EMAIL valid:', hasValidEmail, CLIENT_EMAIL)
  
  const isConfigured = hasValidProjectId && hasValidPrivateKey && hasValidEmail
  console.log('- Overall configured:', isConfigured)
  
  return isConfigured
}

export async function GET() {
  const result = isGoogleCloudConfigured()
  
  return NextResponse.json({
    configured: result,
    PROJECT_ID: PROJECT_ID,
    CLIENT_EMAIL: CLIENT_EMAIL,
    PRIVATE_KEY_PREVIEW: PRIVATE_KEY?.substring(0, 50),
    checks: {
      hasValidProjectId: !!(PROJECT_ID && PROJECT_ID !== 'your-project-id'),
      hasValidPrivateKey: !!(PRIVATE_KEY && !PRIVATE_KEY.includes('your-private-key')),
      hasValidEmail: !!(CLIENT_EMAIL && CLIENT_EMAIL !== 'your-service-account@your-project.iam.gserviceaccount.com')
    }
  })
}
