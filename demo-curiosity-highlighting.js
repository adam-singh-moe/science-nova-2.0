// Demo script to show how Curiosity Engine processes text
const demoText = `
The young scientist examined the ancient fossil embedded in the sedimentary rock. 
The specimen, preserved for millions of years, revealed secrets about prehistoric life. 
Through careful excavation, the paleontologist discovered evidence of an entire ecosystem 
that once thrived where a volcano had erupted, covering the habitat in ash. 
The geological layers showed how gravity and erosion had shaped the landscape over time.
Each molecule and atom in the crystal formations told a story of immense pressure and energy.
`;

// Simulate the curiosity keyword detection
const curiosityKeywords = [
  'gravity', 'volcano', 'fossil', 'photosynthesis', 'ecosystem', 'planet',
  'molecule', 'atom', 'energy', 'force', 'motion', 'habitat', 'species',
  'evolution', 'climate', 'weather', 'earthquake', 'solar', 'magnetic',
  'chemical', 'reaction', 'crystal', 'mineral', 'bacteria', 'virus',
  'DNA', 'cell', 'organ', 'system', 'adaptation', 'predator', 'prey',
  'fossil', 'sedimentary', 'specimen', 'prehistoric', 'excavation',
  'paleontologist', 'geological', 'erosion', 'pressure'
];

function highlightCuriosityPoints(text) {
  let processedText = text;
  
  curiosityKeywords.forEach(keyword => {
    const regex = new RegExp(`\\b${keyword}\\b`, 'gi');
    processedText = processedText.replace(regex, `✨${keyword}✨`);
  });
  
  return processedText;
}

console.log('🔮 Curiosity Engine Demo - Text Processing\n');
console.log('📖 Original Text:');
console.log(demoText.trim());

console.log('\n✨ Processed with Curiosity Points:');
console.log(highlightCuriosityPoints(demoText).trim());

console.log('\n🤖 Each ✨word✨ would glow blue and be clickable to summon Professor Nova!');
console.log('\n🎯 Found Keywords in This Text:');
const foundKeywords = curiosityKeywords.filter(keyword => 
  demoText.toLowerCase().includes(keyword.toLowerCase())
);
console.log(`   ${foundKeywords.join(', ')}`);
console.log(`\n📊 Total Interactive Learning Opportunities: ${foundKeywords.length}`);
