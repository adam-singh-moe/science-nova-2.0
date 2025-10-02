// Test script to check discovery API
const fetch = require('node-fetch');

async function testDiscoveryAPI() {
  try {
    console.log('🧪 Testing Discovery API...\n');
    
    // Test basic discovery content fetch
    const testUserId = '1da1b379-1f3a-476a-a44f-25e3ae734515'; // From your Supabase screenshot
    const url = `http://localhost:3000/api/discovery?userId=${testUserId}&grade=4`;
    
    console.log(`Fetching: ${url}`);
    
    const response = await fetch(url);
    const result = await response.json();
    
    console.log('\n📊 API Response Status:', response.status);
    console.log('📊 API Response:', JSON.stringify(result, null, 2));
    
    if (result.data && result.data.length > 0) {
      console.log('\n✅ Success! Discovery content found:');
      result.data.forEach((item, index) => {
        console.log(`  ${index + 1}. ${item.title}`);
        console.log(`     Content Type: ${item.content_type}`);
        console.log(`     Fact Text: ${item.fact_text?.substring(0, 100)}...`);
      });
    } else {
      console.log('\n❌ No discovery content found');
    }
    
  } catch (error) {
    console.error('❌ Error testing discovery API:', error.message);
  }
}

testDiscoveryAPI();