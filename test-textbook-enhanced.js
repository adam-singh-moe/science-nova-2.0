// Enhanced test script for textbook processing with detailed error reporting
const fetch = require('node-fetch');

async function testTextbookProcessing() {
  try {
    console.log('🚀 Testing enhanced textbook processing pipeline...\n');
    
    const response = await fetch('http://localhost:3000/api/test-process-textbooks', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      }
    });
    
    const result = await response.json();
    
    console.log('📊 PROCESSING SUMMARY:');
    console.log('='.repeat(50));
    
    if (result.summary) {
      const { summary } = result;
      console.log(`📁 Total files processed: ${summary.totalProcessed}`);
      console.log(`✅ Successful: ${summary.totalSuccessful}`);
      console.log(`❌ Failed: ${summary.totalFailed}`);
      console.log(`📚 Total chunks created: ${summary.totalChunks}`);
      console.log(`📈 Success rate: ${((summary.totalSuccessful / summary.totalProcessed) * 100).toFixed(1)}%`);
    }
    
    console.log('\n📋 DETAILED RESULTS BY GRADE:');
    console.log('='.repeat(50));
    
    if (result.results) {
      const resultsByGrade = {};
      
      // Group results by grade
      result.results.forEach(item => {
        if (!resultsByGrade[item.grade]) {
          resultsByGrade[item.grade] = [];
        }
        resultsByGrade[item.grade].push(item);
      });
      
      // Display results by grade
      Object.keys(resultsByGrade).sort((a, b) => parseInt(a) - parseInt(b)).forEach(grade => {
        const gradeResults = resultsByGrade[grade];
        const successful = gradeResults.filter(r => r.success).length;
        const total = gradeResults.length;
        
        console.log(`\n📖 Grade ${grade}: ${successful}/${total} successful`);
        
        gradeResults.forEach(item => {
          const status = item.success ? '✅' : '❌';
          const chunks = item.chunksProcessed > 0 ? ` (${item.chunksProcessed} chunks)` : '';
          const method = item.extractionMethod ? ` [${item.extractionMethod}]` : '';
          
          console.log(`  ${status} ${item.fileName}${chunks}${method}`);
          
          if (!item.success && item.error) {
            console.log(`     🔍 Error: ${item.error}`);
          }
        });
      });
    }
    
    console.log('\n🔍 FAILURE ANALYSIS:');
    console.log('='.repeat(50));
    
    if (result.summary && result.summary.failureReasons) {
      const reasons = result.summary.failureReasons;
      const sortedReasons = Object.entries(reasons)
        .sort(([,a], [,b]) => b - a); // Sort by count, descending
      
      if (sortedReasons.length === 0) {
        console.log('🎉 No failures detected!');
      } else {
        sortedReasons.forEach(([reason, count]) => {
          console.log(`❌ ${reason}: ${count} occurrence(s)`);
        });
        
        console.log('\n💡 RECOMMENDATIONS:');
        console.log('-'.repeat(30));
          sortedReasons.forEach(([reason, count]) => {
          if (reason.includes('color space') && reason.includes('ocr')) {
            console.log(`🤖 For color space issues: OCR was attempted but failed - may need PDF preprocessing`);
          } else if (reason.includes('color space')) {
            console.log(`🔧 For color space issues: Try OCR fallback or PDF format conversion`);
          } else if (reason.includes('encrypted')) {
            console.log(`🔒 For encrypted PDFs: Remove password protection or provide decryption`);
          } else if (reason.includes('insufficient text')) {
            console.log(`📄 For insufficient text: Check if PDFs are image-based - OCR should handle this`);
          } else if (reason.includes('Download failed')) {
            console.log(`🌐 For download issues: Check Supabase storage permissions and file paths`);
          } else if (reason.includes('ocr')) {
            console.log(`🤖 For OCR failures: May need higher resolution images or manual processing`);
          }
        });
      }
    }
    
    console.log('\n🎯 NEXT STEPS:');
    console.log('='.repeat(50));
    
    if (result.summary) {
      const { summary } = result;
      
      if (summary.totalSuccessful === summary.totalProcessed) {
        console.log('🎉 All textbooks processed successfully!');
        console.log('✅ Ready for production use');
      } else if (summary.totalSuccessful > 0) {
        console.log(`✅ Partial success: ${summary.totalSuccessful} files processed`);
        console.log(`🔧 ${summary.totalFailed} files need attention`);
        console.log('📋 Review failure analysis above for specific fixes');
      } else {
        console.log('❌ No files processed successfully');
        console.log('🚨 Check system configuration and file accessibility');
      }
      
      if (summary.totalChunks > 0) {
        console.log(`📚 ${summary.totalChunks} text chunks ready for search and retrieval`);
      }
    }
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    
    if (error.code === 'ECONNREFUSED') {
      console.log('\n💡 Make sure the development server is running:');
      console.log('   npm run dev');
    }
  }
}

// Run the test
testTextbookProcessing();
