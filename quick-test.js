// Simple test to verify current textbook processing status
const fetch = require('node-fetch');

async function quickTest() {
  try {
    console.log('🔍 Quick status check of textbook processing...\n');
    
    const response = await fetch('http://localhost:3001/api/test-process-textbooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    console.log('📊 RESULTS:');
    console.log('='.repeat(40));
    
    if (result.results) {
      const successful = result.results.filter(r => r.success);
      const failed = result.results.filter(r => !r.success);
      
      console.log(`✅ Successful: ${successful.length}/6 files`);
      console.log(`❌ Failed: ${failed.length}/6 files`);
      
      if (successful.length > 0) {
        const totalChunks = successful.reduce((sum, r) => sum + r.chunksProcessed, 0);
        console.log(`📚 Total chunks: ${totalChunks}`);
        
        console.log('\n✅ Working files:');
        successful.forEach(item => {
          console.log(`   Grade ${item.grade}: ${item.chunksProcessed} chunks`);
        });
      }
      
      if (failed.length > 0) {
        console.log('\n❌ Failed files:');
        failed.forEach(item => {
          console.log(`   Grade ${item.grade}: ${item.error}`);
        });
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
  }
}

quickTest();
