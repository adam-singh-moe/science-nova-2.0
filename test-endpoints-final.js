const http = require('http');

async function testEndpoint(url, data) {
    return new Promise((resolve, reject) => {
        const postData = JSON.stringify(data);
        
        const options = {
            hostname: 'localhost',
            port: 3001,
            path: url,
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Content-Length': Buffer.byteLength(postData)
            }
        };

        const req = http.request(options, (res) => {
            let body = '';
            res.on('data', (chunk) => {
                body += chunk;
            });
            res.on('end', () => {
                try {
                    const response = JSON.parse(body);
                    resolve({ status: res.statusCode, data: response });
                } catch (e) {
                    resolve({ status: res.statusCode, data: body });
                }
            });
        });

        req.on('error', (e) => {
            reject(e);
        });

        req.write(postData);
        req.end();
    });
}

async function runTests() {
    console.log('🚀 Testing Final Storybook Implementation\n');

    // Test cases with different prompts
    const testCases = [
        {
            name: "Ocean Adventure",
            prompt: "A magical underwater kingdom with coral reefs and swimming dolphins"
        },
        {
            name: "Space Exploration", 
            prompt: "Astronauts exploring alien planets with glowing crystals"
        },
        {
            name: "Forest Journey",
            prompt: "Ancient forest with magical creatures and glowing fireflies"
        },
        {
            name: "Mountain Quest",
            prompt: "Snow-capped mountains with eagles soaring through clouds"
        }
    ];

    for (const testCase of testCases) {
        console.log(`📖 Testing: ${testCase.name}`);
        
        try {
            // Test main image generation endpoint
            const imageResult = await testEndpoint('/api/generate-image', {
                prompt: testCase.prompt
            });
            
            console.log(`   Main API Status: ${imageResult.status}`);
            if (imageResult.data.type) {
                console.log(`   Background Type: ${imageResult.data.type}`);
                if (imageResult.data.vantaEffect) {
                    console.log(`   Vanta Effect: ${imageResult.data.vantaEffect}`);
                }
            }
            
            // Test Vanta fallback endpoint
            const vantaResult = await testEndpoint('/api/generate-vanta-image', {
                prompt: testCase.prompt
            });
            
            console.log(`   Vanta API Status: ${vantaResult.status}`);
            if (vantaResult.data.vantaEffect) {
                console.log(`   Vanta Effect: ${vantaResult.data.vantaEffect}`);
            }
            
        } catch (error) {
            console.log(`   ❌ Error: ${error.message}`);
        }
        
        console.log('');
    }

    console.log('✅ Testing Complete!');
    console.log('\n📋 Summary:');
    console.log('- Main storybook should be accessible at http://localhost:3001/learning-adventure');
    console.log('- Both AI image generation and Vanta.js fallbacks should work');
    console.log('- Error handling should gracefully fallback to gradients if needed');
    console.log('- Rate limiting should prevent API spam');
}

runTests().catch(console.error);
