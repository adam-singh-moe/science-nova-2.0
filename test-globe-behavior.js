console.log('🌍 Testing Globe Background Behavior...');

console.log('');
console.log('📝 **Lesson Builder Context:**');
console.log('   <VantaBackground effect="globe" lessonBuilder={true} />');
console.log('   → Uses palette system colors (dark preset by default)');
console.log('   → Background: 0x0b1221 (dark blue)');
console.log('   → Color: 0x52a7f9 (bright blue)');
console.log('   → Color2: 0x7c90ff (purple-blue)');

console.log('');
console.log('🏠 **Default Application Context:**');
console.log('   <VantaBackground effect="globe" />');
console.log('   → Uses hardcoded custom colors');
console.log('   → Background: 0x111025 (dark purple)');
console.log('   → Color: 0x56bb (blue)');
console.log('   → Color2: 0xf24a68 (pink/red)');

console.log('');
console.log('🎨 **With Explicit Preset:**');
console.log('   <VantaBackground effect="globe" preset="ocean" />');
console.log('   → Uses palette system colors (ocean preset)');
console.log('   → Background: 0x0b1221 (dark blue)');
console.log('   → Color: 0x52a7f9 (bright blue)');
console.log('   → Color2: 0x1ec8c8 (cyan)');

console.log('');
console.log('✅ **How it works:**');
console.log('   • Lesson builder gets themed globe backgrounds');
console.log('   • Rest of app keeps your custom purple/pink globe');
console.log('   • Explicit presets always use palette system');
console.log('   • Default behavior preserves your customization');

console.log('');
console.log('🔄 **Available presets for lesson builder:**');
['dark', 'ocean', 'nebula', 'forest', 'sunset'].forEach(preset => {
  console.log(`   • ${preset}`);
});
