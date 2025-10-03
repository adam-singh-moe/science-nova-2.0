// Test script to directly test the embeddings processing API
const fetch = require('node-fetch');

async function testEmbeddingsAPI() {
  try {
    console.log('Testing embeddings processing API...');
    
    // First, get the list of documents
    console.log('\n1. Getting documents list...');
    const documentsResponse = await fetch('http://localhost:3001/api/documents');
    const documents = await documentsResponse.json();
    
    console.log('Documents response:', JSON.stringify(documents, null, 2));
    
    if (!documents.documents || documents.documents.length === 0) {
      console.log('No documents found to process');
      return;
    }
    
    // Test processing with the first document
    const firstDoc = documents.documents[0];
    console.log('\n2. Testing processing with document:', firstDoc.name);
    
    const processRequest = {
      documents: [firstDoc]
    };
    
    console.log('Process request payload:', JSON.stringify(processRequest, null, 2));
    
    const processResponse = await fetch('http://localhost:3001/api/embeddings/process', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(processRequest)
    });
    
    const processResult = await processResponse.json();
    
    console.log('\n3. Process response status:', processResponse.status);
    console.log('Process response:', JSON.stringify(processResult, null, 2));
    
  } catch (error) {
    console.error('Error testing API:', error.message);
  }
}

testEmbeddingsAPI();