const fetch = require('node-fetch');

async function testMultipleShuffle() {
  console.log('Testing multiple shuffles to see variety...\n');
  
  for (let i = 1; i <= 5; i++) {
    console.log(`=== Shuffle ${i} ===`);
    
    const discoveryResponse = await fetch('http://localhost:3000/api/discovery/next');
    const discoveryData = await discoveryResponse.json();
    console.log(`Discovery: ${discoveryData.topic?.title} (${discoveryData.facts?.length} facts)`);
    
    const arcadeResponse = await fetch('http://localhost:3000/api/arcade/next');
    const arcadeData = await arcadeResponse.json();
    console.log(`Arcade: ${arcadeData.topic?.title} (${arcadeData.items?.length} items)`);
    console.log('');
  }
}

testMultipleShuffle().catch(console.error);