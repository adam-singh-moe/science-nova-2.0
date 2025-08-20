// Quick Vertex AI sanity test: loads .env.local, gets an access token and calls Imagen 4.0 generateImages
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Load env from .env.local
try {
  const dotenv = await import('dotenv')
  const envPath = path.resolve(__dirname, '..', '.env.local')
  dotenv.config({ path: envPath })
  console.log(`Loaded env from ${envPath}`)
} catch (e) {
  console.warn('dotenv not available or failed to load; relying on process.env')
}

const projectId = process.env.GOOGLE_CLOUD_PROJECT_ID
const clientEmail = process.env.GOOGLE_CLOUD_CLIENT_EMAIL
const privateKeyRaw = process.env.GOOGLE_CLOUD_PRIVATE_KEY || ''
const privateKey = privateKeyRaw.includes('\\n') ? privateKeyRaw.replace(/\\n/g, '\n') : privateKeyRaw
const location = process.env.GOOGLE_CLOUD_LOCATION || 'us-central1'

function assertEnv(name, value) {
  if (!value) throw new Error(`Missing env: ${name}`)
}

async function main() {
  assertEnv('GOOGLE_CLOUD_PROJECT_ID', projectId)
  assertEnv('GOOGLE_CLOUD_CLIENT_EMAIL', clientEmail)
  assertEnv('GOOGLE_CLOUD_PRIVATE_KEY', privateKey)

  console.log('Env OK. Requesting access token...')

  const { JWT } = await import('google-auth-library')
  const jwt = new JWT({
    email: clientEmail,
    key: privateKey,
    scopes: ['https://www.googleapis.com/auth/cloud-platform'],
  })
  const { access_token } = await jwt.authorize()
  if (!access_token) throw new Error('Failed to get access token')
  console.log('Access token acquired.')

  const prompt = 'A simple diagram of the water cycle with clouds and arrows, classroom-safe, no labels.'
  const instances = [{ prompt, aspectRatio: '16:9' }]
  const parameters = { sampleCount: 1 }

  const versions = ['v1', 'v1beta1']
  const models = ['imagegeneration@006', 'imagegeneration@005']
  let json = null
  let lastErr = null
  for (const ver of versions) {
    for (const modelId of models) {
      const url = `https://${location}-aiplatform.googleapis.com/${ver}/projects/${projectId}/locations/${location}/publishers/google/models/${modelId}:predict`
      console.log('Calling Vertex AI Imagen:', url)
      const resp = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${access_token}` },
        body: JSON.stringify({ instances, parameters }),
      })
      if (resp.ok) { json = await resp.json(); lastErr = null; break }
      let text
      try { text = await resp.text() } catch { text = `<no body>` }
      lastErr = `HTTP ${resp.status}: ${text?.slice(0, 400)}`
    }
    if (json) break
  }
  if (!json) {
    console.error('All attempts failed. Last error:', lastErr)
    process.exit(2)
  }
  let b64
  const pred0 = json?.predictions?.[0]
  if (pred0?.bytesBase64Encoded) b64 = pred0.bytesBase64Encoded
  if (!b64 && pred0?.image) b64 = pred0.image
  if (!b64) {
    // try known alternate shapes
    const cand = json?.response?.candidates?.[0]
    const parts = cand?.content?.parts || []
    const inline = parts.find(p => p?.inlineData?.data)?.inlineData
    if (inline?.data) b64 = inline.data
  }

  if (!b64) {
    console.error('No image data found in response.')
    console.dir(json, { depth: 4 })
    process.exit(3)
  }

  const outDir = path.resolve(__dirname, '..', 'tmp')
  const outPath = path.join(outDir, 'vertex-test.png')
  fs.mkdirSync(outDir, { recursive: true })
  fs.writeFileSync(outPath, Buffer.from(b64, 'base64'))
  console.log('Success. Wrote image to', outPath)
}

main().catch((e) => {
  console.error('Test failed:', e?.message || e)
  process.exit(1)
})
