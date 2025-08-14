import { type NextRequest, NextResponse } from "next/server"

const PROJECT_ID = process.env.GOOGLE_CLOUD_PROJECT_ID
const PRIVATE_KEY = process.env.GOOGLE_CLOUD_PRIVATE_KEY
const CLIENT_EMAIL = process.env.GOOGLE_CLOUD_CLIENT_EMAIL

export async function GET() {
  return NextResponse.json({
    PROJECT_ID: PROJECT_ID,
    CLIENT_EMAIL: CLIENT_EMAIL,
    PRIVATE_KEY_LENGTH: PRIVATE_KEY?.length,
    PRIVATE_KEY_SAMPLE: PRIVATE_KEY?.substring(0, 100),
    HAS_PLACEHOLDER: PRIVATE_KEY?.includes('your-private-key'),
    EMAIL_IS_PLACEHOLDER: CLIENT_EMAIL === 'your-service-account@your-project.iam.gserviceaccount.com',
    PROJECT_IS_PLACEHOLDER: PROJECT_ID === 'your-project-id'
  })
}
