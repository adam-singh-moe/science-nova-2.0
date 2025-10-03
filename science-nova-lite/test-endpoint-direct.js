// Direct test of the embeddings status endpoint
async function testStatusEndpoint() {
  try {
    console.log('Testing /api/embeddings/status endpoint...');
    
    const response = await fetch('http://localhost:3000/api/embeddings/status');
    
    console.log('Status:', response.status);
    console.log('Status Text:', response.statusText);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Response data:', JSON.stringify(data, null, 2));
      
      // Test the UI logic conversion
      const statusByDocumentName = {};
      
      if (data.documents && Array.isArray(data.documents)) {
        data.documents.forEach(doc => {
          statusByDocumentName[doc.name] = {
            processed: doc.processed,
            chunks: doc.chunkCount,
            error: doc.error
          };
        });
      }
      
      console.log('Converted for UI:', JSON.stringify(statusByDocumentName, null, 2));
      
      // Test document processing check
      const testDoc = { name: 'Science Around Us Book 1.pdf' };
      const isProcessed = statusByDocumentName[testDoc.name]?.processed || false;
      console.log(`${testDoc.name} is processed:`, isProcessed);
      
    } else {
      console.error('Failed to fetch:', response.status, response.statusText);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

if (typeof window !== 'undefined') {
  // Browser environment
  testStatusEndpoint();
} else {
  // Node environment
  const fetch = require('node-fetch');
  testStatusEndpoint();
}