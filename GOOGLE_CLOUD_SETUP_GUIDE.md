# 🔑 Google Cloud Imagen 3.0 API Setup Guide

## 📋 Prerequisites
- Google Cloud Platform account
- Access to Google Cloud Console
- Billing account enabled (Imagen API requires billing)

## 🚀 Step-by-Step Setup

### 1. Create a Google Cloud Project

1. Go to [Google Cloud Console](https://console.cloud.google.com/)
2. Click "Select a project" dropdown at the top
3. Click "New Project"
4. Enter a project name (e.g., "science-nova-ai")
5. Click "Create"

### 2. Enable Required APIs

1. In the Google Cloud Console, go to **APIs & Services** > **Library**
2. Search for and enable these APIs:
   - **Vertex AI API** (required for Imagen)
   - **Cloud Resource Manager API**
   - **Service Usage API**

### 3. Set Up Billing (Required)

1. Go to **Billing** in the Cloud Console
2. Link a billing account to your project
3. **Note**: Imagen API requires billing to be enabled

### 4. Create a Service Account

1. Go to **IAM & Admin** > **Service Accounts**
2. Click "Create Service Account"
3. Enter details:
   - **Name**: `science-nova-ai-service`
   - **Description**: `Service account for Science Nova AI image generation`
4. Click "Create and Continue"
5. Assign roles:
   - **Vertex AI User**
   - **Service Account User**
6. Click "Continue" then "Done"

### 5. Generate Service Account Key

1. Click on your newly created service account
2. Go to the **Keys** tab
3. Click "Add Key" > "Create new key"
4. Select **JSON** format
5. Click "Create"
6. **Important**: Save the downloaded JSON file securely

### 6. Configure Environment Variables

Open your `.env.local` file and replace the Google Cloud placeholders:

```bash
# Google Cloud Configuration (for Imagen API)
GOOGLE_CLOUD_PROJECT_ID=your-actual-project-id
GOOGLE_CLOUD_PRIVATE_KEY_ID=key-id-from-json
GOOGLE_CLOUD_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nactual-private-key-content\n-----END PRIVATE KEY-----\n"
GOOGLE_CLOUD_CLIENT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
```

## 🔧 How to Extract Values from Service Account JSON

Your downloaded JSON file will look like this:

```json
{
  "type": "service_account",
  "project_id": "your-project-123456",
  "private_key_id": "abcd1234...",
  "private_key": "-----BEGIN PRIVATE KEY-----\nMIIEvgIBADANBgkqhkiG9w0BAQEFAASCBKgwggSkAgEAAoIBAQC...\n-----END PRIVATE KEY-----\n",
  "client_email": "science-nova-ai-service@your-project-123456.iam.gserviceaccount.com",
  "client_id": "123456789...",
  "auth_uri": "https://accounts.google.com/o/oauth2/auth",
  "token_uri": "https://oauth2.googleapis.com/token",
  "auth_provider_x509_cert_url": "https://www.googleapis.com/oauth2/v1/certs",
  "client_x509_cert_url": "https://www.googleapis.com/robot/v1/metadata/x509/..."
}
```

### Extract these values:

1. **GOOGLE_CLOUD_PROJECT_ID**: Copy the `project_id` value
2. **GOOGLE_CLOUD_PRIVATE_KEY_ID**: Copy the `private_key_id` value
3. **GOOGLE_CLOUD_PRIVATE_KEY**: Copy the entire `private_key` value (including the BEGIN/END lines)
4. **GOOGLE_CLOUD_CLIENT_EMAIL**: Copy the `client_email` value

## ⚠️ Important Security Notes

### DO NOT:
- Commit the JSON file to version control
- Share your private key or service account credentials
- Leave default/placeholder values in production

### DO:
- Store the JSON file in a secure location
- Add `.env.local` to your `.gitignore` (it should already be there)
- Use different service accounts for development/production
- Regularly rotate service account keys

## 🧪 Testing Your Setup

After configuring the credentials, test them:

```bash
# Run the credential test script
node test-endpoints-final.js
```

Or visit the debug endpoint:
```
http://localhost:3001/api/debug-credentials
```

## 💰 Cost Information

**Imagen 3.0 Pricing** (as of 2024):
- **Imagen 3.0 Fast**: ~$0.04 per image
- **Imagen 3.0 Standard**: ~$0.08 per image

**Cost Optimization Tips**:
- The app uses intelligent caching to avoid regenerating the same images
- Rate limiting prevents excessive API calls
- Vanta.js backgrounds provide beautiful fallbacks when API limits are reached

## 🔍 Troubleshooting

### Common Issues:

**1. "Invalid credentials" error**
- Verify all environment variables are set correctly
- Check that the private key includes the full BEGIN/END block
- Ensure there are no extra spaces or newlines

**2. "API not enabled" error**
- Go to APIs & Services > Library
- Enable Vertex AI API for your project

**3. "Billing not enabled" error**
- Set up billing in Google Cloud Console
- Imagen API requires an active billing account

**4. "Permission denied" error**
- Verify your service account has the "Vertex AI User" role
- Check that the service account is created in the correct project

### Debug Commands:

```bash
# Check environment variables
node -e "console.log(process.env.GOOGLE_CLOUD_PROJECT_ID)"
node -e "console.log(process.env.GOOGLE_CLOUD_CLIENT_EMAIL)"

# Test API endpoint
curl -X POST http://localhost:3001/api/debug-credentials
```

## ✅ Verification Checklist

- [ ] Google Cloud project created
- [ ] Vertex AI API enabled
- [ ] Billing account linked
- [ ] Service account created with proper roles
- [ ] JSON key downloaded securely
- [ ] Environment variables configured in `.env.local`
- [ ] Application restarted after configuration
- [ ] Test endpoint returns successful response

Once complete, your storybook will generate beautiful, contextually relevant AI images for each page, enhancing the immersive learning experience!
