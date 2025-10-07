const { DoclingSDK } = require('docling-sdk')

async function testDoclingSDK() {
  try {
    console.log('Testing Docling SDK availability...')
    
    // Check if the SDK can be initialized
    const docling = new DoclingSDK()
    console.log('Docling SDK initialized successfully')
    
    // Check available methods
    console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(docling)))
    
  } catch (error) {
    console.error('Error testing Docling SDK:', error.message)
    console.log('This might require Python Docling to be installed first')
  }
}

testDoclingSDK()