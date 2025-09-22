console.log('🔄 Forcing Vanta.js cache refresh...');

// Clear browser cache for Vanta scripts
if (typeof window !== 'undefined') {
  // Remove all existing Vanta script tags
  const vantaScripts = document.querySelectorAll('script[src*="vanta"]');
  vantaScripts.forEach(script => script.remove());
  
  // Clear VANTA and THREE from window
  if (window.VANTA) {
    delete window.VANTA;
  }
  if (window.THREE) {
    delete window.THREE;
  }
  
  console.log('✅ Vanta cache cleared');
  console.log('🔄 Please refresh the page to see color changes');
}

console.log('');
console.log('🎨 Current globe colors:');
console.log('   - backgroundColor: 0x111025 (dark purple)');
console.log('   - color: 0x56bb (blue)'); 
console.log('   - color2: 0xf24a68 (pink/red)');

console.log('');
console.log('💡 If colors still not showing:');
console.log('   1. Hard refresh the page (Ctrl+F5)');
console.log('   2. Open DevTools and disable cache');
console.log('   3. Check browser console for Vanta errors');
console.log('   4. Try a different browser or incognito mode');
