// Quick test of the main image generation API
const http = require('http');

async function testImageGeneration() {
    console.log('🧪 Testing Image Generation API...\n');
    
    const testPrompt = "A beautiful underwater coral reef with colorful fish swimming";
    
    try {
        const postData = JSON.stringify({
            prompt: testPrompt,
            aspectRatio: "16:9"
        });
        
        const options = {
            hostname: 'localhost',
            port: 3000,
            path: '/api/generate-image',
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const response = await new Promise((resolve, reject) => {
            const req = http.request(options, (res) => {
                let body = '';
                res.on('data', (chunk) => {
                    body += chunk;
                });
                res.on('end', () => {
                    try {
                        const data = JSON.parse(body);
                        resolve({ status: res.statusCode, data });
                    } catch (e) {
                        resolve({ status: res.statusCode, data: body });
                    }
                });
            });

            req.on('error', reject);
            req.write(postData);
            req.end();
        });

        console.log(`Status: ${response.status}`);
        console.log(`Response:`, JSON.stringify(response.data, null, 2));
        
        if (response.data.success) {
            console.log(`\n✅ API call successful!`);
            console.log(`Type: ${response.data.type || 'unknown'}`);
            
            if (response.data.type === 'ai-generated') {
                console.log(`🎨 AI image generation is working!`);
            } else if (response.data.type === 'gradient') {
                console.log(`🎭 Using gradient fallback (this is expected if credentials aren't configured)`);
                if (response.data.vantaEffect) {
                    console.log(`Vanta effect: ${response.data.vantaEffect}`);
                }
            }
        } else {
            console.log(`❌ API call failed`);
        }
        
    } catch (error) {
        console.error('❌ Error testing API:', error.message);
    }
}

testImageGeneration();
