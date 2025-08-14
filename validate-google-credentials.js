// Google Cloud Credential Validation Script
// Run this after setting up your credentials to verify they work

const http = require('http');

async function validateCredentials() {
    console.log('🔍 Validating Google Cloud Credentials...\n');
    
    try {
        // Test the debug credentials endpoint
        const response = await fetch('http://localhost:3000/api/debug-credentials');
        const data = await response.json();
        
        console.log('📊 Credential Status:');
        console.log(`   Project ID: ${data.hasProjectId ? '✅ Valid' : '❌ Missing/Invalid'}`);
        console.log(`   Private Key: ${data.hasPrivateKey ? '✅ Valid' : '❌ Missing/Invalid'}`);
        console.log(`   Client Email: ${data.hasClientEmail ? '✅ Valid' : '❌ Missing/Invalid'}`);
        console.log(`   Overall Status: ${data.isConfigured ? '✅ READY' : '❌ NOT CONFIGURED'}\n`);
        
        if (data.isConfigured) {
            console.log('🎉 Credentials are properly configured!');
            console.log('   Your storybook will now generate AI images.');
            
            // Test actual image generation
            console.log('\n🧪 Testing image generation...');
            const testResponse = await fetch('http://localhost:3000/api/generate-image', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ 
                    prompt: 'A beautiful sunset over the ocean with dolphins jumping',
                    aspectRatio: '16:9'
                })
            });
            
            const testResult = await testResponse.json();
            console.log(`   Generation test: ${testResult.success ? '✅ SUCCESS' : '❌ FAILED'}`);
            console.log(`   Result type: ${testResult.type || 'unknown'}`);
            
            if (testResult.success && testResult.type === 'ai-generated') {
                console.log('🚀 AI image generation is working perfectly!');
            } else if (testResult.success && testResult.type === 'gradient') {
                console.log('⚠️  Falling back to gradients (check API quotas/billing)');
            } else {
                console.log('❌ Image generation failed - check logs for details');
            }
            
        } else {
            console.log('❌ Credentials not configured properly.');
            console.log('   Please follow the setup guide:');
            console.log('   📖 See: GOOGLE_CLOUD_SETUP_GUIDE.md');
            
            console.log('\n🔧 Next steps:');
            console.log('   1. Create a Google Cloud project');
            console.log('   2. Enable Vertex AI API');
            console.log('   3. Set up billing');
            console.log('   4. Create a service account');
            console.log('   5. Download JSON key file');
            console.log('   6. Update .env.local with your credentials');
            console.log('   7. Restart the development server');
        }
        
    } catch (error) {
        console.error('❌ Error validating credentials:', error.message);
        console.log('\n💡 Make sure the development server is running:');
        console.log('   npm run dev');
        console.log('   Then visit: http://localhost:3000/learning-adventure');
    }
}

// Helper function for Node.js environments that don't have fetch
if (typeof fetch === 'undefined') {
    global.fetch = async (url, options = {}) => {
        const http = require('http');
        const https = require('https');
        const { URL } = require('url');
        
        return new Promise((resolve, reject) => {
            const parsedUrl = new URL(url);
            const protocol = parsedUrl.protocol === 'https:' ? https : http;
            
            const requestOptions = {
                hostname: parsedUrl.hostname,
                port: parsedUrl.port,
                path: parsedUrl.pathname + parsedUrl.search,
                method: options.method || 'GET',
                headers: options.headers || {}
            };
            
            const req = protocol.request(requestOptions, (res) => {
                let body = '';
                res.on('data', chunk => body += chunk);
                res.on('end', () => {
                    resolve({
                        ok: res.statusCode >= 200 && res.statusCode < 300,
                        status: res.statusCode,
                        json: () => Promise.resolve(JSON.parse(body))
                    });
                });
            });
            
            req.on('error', reject);
            
            if (options.body) {
                req.write(options.body);
            }
            
            req.end();
        });
    };
}

validateCredentials();
