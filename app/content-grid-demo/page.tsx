"use client"

// import { ContentGrid } from "@/components/topic/content-grid"
import { VantaBackground } from "@/components/vanta-background"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { theme } from "@/lib/theme"

const sampleContent = `
# The Amazing World of Photosynthesis

Photosynthesis is the incredible process by which plants make their own food using sunlight, water, and carbon dioxide. This process is essential for all life on Earth!

## How Does Photosynthesis Work?

Plants have special parts called chloroplasts that contain a green substance called chlorophyll. When sunlight hits the chlorophyll, it starts a chemical reaction that combines water and carbon dioxide to make glucose (sugar) and oxygen.

Fun fact: A single tree can produce enough oxygen for two people to breathe for an entire year! Trees are like giant oxygen factories working 24/7 to keep our air clean.

The process happens mainly in the leaves of plants. The leaves have tiny pores called stomata that open and close to let carbon dioxide in and oxygen out.

Did you know that without photosynthesis, there would be no life on Earth as we know it? All the oxygen we breathe was originally created by plants through this amazing process.

## The Photosynthesis Equation

Scientists write the photosynthesis process as a simple equation:
6CO2 + 6H2O + light energy → C6H12O6 + 6O2

This means: carbon dioxide + water + light energy → glucose + oxygen

Amazing fact: Photosynthesis removes about 120 billion tons of carbon dioxide from the atmosphere every year! That's like removing millions of cars from the road.

Plants are incredibly efficient at this process. Some plants, like algae, can convert up to 3% of sunlight into chemical energy through photosynthesis.

image: /placeholder-photosynthesis-diagram.jpg

The diagram above shows the complete photosynthesis process happening inside a leaf cell.
`

const sampleFlashcards = [
  {
    id: "1",
    front: "What is photosynthesis?",
    back: "The process by which plants make food using sunlight, water, and carbon dioxide"
  },
  {
    id: "2", 
    front: "What gas do plants produce during photosynthesis?",
    back: "Oxygen - which we need to breathe!"
  },
  {
    id: "3",
    front: "What is chlorophyll?",
    back: "The green substance in plants that captures sunlight for photosynthesis"
  },
  {
    id: "4",
    front: "What are stomata?",
    back: "Tiny pores in leaves that let carbon dioxide in and oxygen out"
  }
]

export default function ContentGridDemo() {
  return (
    <>
      <VantaBackground effect="birds" />
      <div className="min-h-screen relative z-10">
        <div className="container mx-auto px-4 py-12">
          {/* Header */}
          <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.primary} border-2 rounded-2xl shadow-lg mb-8`}>
            <CardHeader>
              <CardTitle className={`${theme.text.primary} text-center font-fredoka text-3xl`}>
                🌟 Interactive Content Grid Demo
              </CardTitle>
            </CardHeader>
            <CardContent>
              <p className={`${theme.text.secondary} text-center font-comic text-lg`}>
                Explore how lesson content is automatically transformed into interactive learning cards!
              </p>
            </CardContent>
          </Card>

          {/* Temporarily disabled ContentGrid for debugging */}
          {/* <ContentGrid 
            content={sampleContent}
            flashcards={sampleFlashcards}
          /> */}
          
          <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2 rounded-2xl shadow-lg`}>
            <CardContent className="p-8 text-center">
              <h3 className={`text-xl font-bold ${theme.text.primary} mb-4`}>ContentGrid Temporarily Disabled</h3>
              <p className={`${theme.text.secondary}`}>Debugging component import issues...</p>
            </CardContent>
          </Card>

          {/* Instructions */}
          <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2 rounded-2xl shadow-lg mt-8`}>
            <CardHeader>
              <CardTitle className={`${theme.text.secondary} font-fredoka text-xl`}>
                🎯 How It Works
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className={`${theme.text.secondary} font-comic space-y-3`}>
                <p>✨ <strong>Key Concepts:</strong> Important information is automatically detected and turned into highlight cards</p>
                <p>🤔 <strong>Fun Facts:</strong> Interesting tidbits are identified and displayed in special fact cards</p>
                <p>🔍 <strong>Interactive Diagrams:</strong> Images and diagrams become zoomable with clickable hotspots</p>
                <p>🎴 <strong>Flashcard Decks:</strong> All flashcards are grouped into an interactive study deck</p>
                <p>📱 <strong>Responsive Grid:</strong> Cards automatically arrange themselves for any screen size</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
