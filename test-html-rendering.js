// Test HTML rendering fix
const testContent = `# Animal Colors

Yellow is a cheerful and sunny color! Think of a bright yellow sunflower reaching for the sky or a yummy yellow banana. Yellow can make us feel happy and warm. <div class="w-full h-64 bg-gradient-to-br from-blue-100 to-purple-100 rounded-xl my-4 flex items-center justify-center shadow-lg border-4 border-white"> <div class="text-center p-4"> <div class="text-4xl mb-2">🎨</div> <p class="text-blue-800 font-bold font-comic">A picture of a bright yellow sunflower and a yummy yellow banana.</p> </div> </div>

## More Colors

Red is another exciting color we see everywhere!`

// This should now properly separate the text and HTML
console.log('Testing content processing...')

// Expected result:
// 1. Heading: "Animal Colors"
// 2. Paragraph: "Yellow is a cheerful and sunny color! Think of a bright yellow sunflower reaching for the sky or a yummy yellow banana. Yellow can make us feel happy and warm."
// 3. HTML: The entire div element rendered as HTML
// 4. Heading: "More Colors" 
// 5. Paragraph: "Red is another exciting color we see everywhere!"
