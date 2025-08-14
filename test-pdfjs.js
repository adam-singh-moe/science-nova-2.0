// Test script specifically for PDF.js implementation
const fetch = require('node-fetch');

async function testPDFJS() {
  try {
    console.log('🧪 Testing enhanced PDF.js implementation...\n');
    
    // Wait a moment for server to be ready
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    const response = await fetch('http://localhost:3000/api/test-process-textbooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({})
    });
    
    if (!response.ok) {
      console.error(`❌ API Error: ${response.status} ${response.statusText}`);
      return;
    }
    
    const result = await response.json();
    
    console.log('📊 PDF PROCESSING RESULTS:');
    console.log('='.repeat(50));
    
    if (result.results) {
      result.results.forEach((item, index) => {
        const status = item.success ? '✅' : '❌';
        const method = item.method ? ` (${item.method})` : '';
        const chunks = item.success ? ` - ${item.chunksProcessed} chunks` : '';
        
        console.log(`${status} Grade ${item.grade}${method}${chunks}`);
        
        if (!item.success && item.error) {
          console.log(`   Error: ${item.error}`);
        }
      });
      
      // Summary
      const successful = result.results.filter(r => r.success);
      const failed = result.results.filter(r => !r.success);
      const pdfjs = result.results.filter(r => r.method === 'pdfjs');
      
      console.log('\n📈 SUMMARY:');
      console.log(`✅ Successful: ${successful.length}/6 files`);
      console.log(`❌ Failed: ${failed.length}/6 files`);
      console.log(`🔧 PDF.js method: ${pdfjs.length}/6 files`);
      
      if (successful.length > 0) {
        const totalChunks = successful.reduce((sum, r) => sum + r.chunksProcessed, 0);
        console.log(`📚 Total chunks processed: ${totalChunks}`);
      }
      
      // Method breakdown
      const methods = {};
      successful.forEach(r => {
        if (r.method) {
          methods[r.method] = (methods[r.method] || 0) + 1;
        }
      });
      
      if (Object.keys(methods).length > 0) {
        console.log('\n🛠️ EXTRACTION METHODS:');
        Object.entries(methods).forEach(([method, count]) => {
          console.log(`   ${method}: ${count} files`);
        });
      }
      
      // Focus on previously failing files (Grades 1, 3, 6)
      const previouslyFailing = [1, 3, 6];
      const nowWorking = result.results.filter(r => 
        previouslyFailing.includes(r.grade) && r.success
      );
      
      if (nowWorking.length > 0) {
        console.log('\n🎉 PREVIOUSLY FAILING FILES NOW WORKING:');
        nowWorking.forEach(r => {
          console.log(`   Grade ${r.grade}: ${r.method} - ${r.chunksProcessed} chunks`);
        });
      }
      
    } else {
      console.log('❌ No results returned from API');
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    if (error.code === 'ECONNREFUSED') {
      console.log('💡 Make sure the development server is running on http://localhost:3000');
    }
  }
}

testPDFJS();
