// Test script to verify the fixed API endpoints are working
const testApiEndpoints = async () => {
  console.log('Testing fixed API endpoints...');
  
  try {
    // Test arcade API (should work even without auth for basic functionality)
    const arcadeResponse = await fetch('http://localhost:3001/api/arcade');
    console.log('Arcade API status:', arcadeResponse.status);
    
    if (arcadeResponse.ok) {
      const arcadeData = await arcadeResponse.json();
      console.log('Arcade API working - returned data structure:', Object.keys(arcadeData));
    } else {
      console.log('Arcade API response:', await arcadeResponse.text());
    }
    
  } catch (error) {
    console.error('Error testing API endpoints:', error.message);
  }
};

testApiEndpoints();