"use client"

import { useState } from "react"
import { Storybook } from "@/components/ui/storybook-enhanced"

const testStoryPages = [
  {
    id: "page1",
    title: "The Amazing Discovery",
    content: `Emma stepped into the magical forest where gravity seemed to work differently. She noticed how the ancient fossils were embedded in the sedimentary rock formations. The ecosystem around her was alive with creatures that had adapted through evolution over millions of years.

The volcano in the distance had created this unique habitat where photosynthesis occurred in ways she had never seen before. Each molecule of oxygen seemed to sparkle in the air, and the energy from the sun powered incredible chemical reactions throughout the forest.

She discovered crystals that contained minerals formed under immense pressure deep within the Earth. The geological layers told a story of prehistoric times when different species roamed this land.`,
    backgroundPrompt: "A magical forest with glowing crystals and ancient rock formations",
    backgroundImage: "linear-gradient(135deg, #228b22 0%, #32cd32 50%, #006400 100%)"
  },
  {
    id: "page2", 
    title: "The Science Laboratory",
    content: `In Professor Nova's laboratory, Emma examined the DNA samples under a powerful microscope. Each cell revealed the intricate system of organs that worked together to maintain life. 

The bacteria and virus samples showed her how adaptation allowed these microscopic organisms to survive in different environments. She learned about the magnetic fields that protected Earth from harmful solar radiation.

The chemical reactions happening in the petri dishes demonstrated the fundamental forces of motion and energy that governed all life on their planet.`,
    backgroundPrompt: "A modern science laboratory with microscopes and glowing samples",
    backgroundImage: "linear-gradient(135deg, #f0f8ff 0%, #e6e6fa 50%, #d3d3d3 100%)"
  }
];

export default function TestCuriosityPage() {
  const [showStorybook, setShowStorybook] = useState(false)

  if (showStorybook) {
    return (
      <Storybook
        pages={testStoryPages}
        title="Curiosity Engine Test Story"
        onClose={() => setShowStorybook(false)}
        gradeLevel={5}
      />
    )
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-black flex items-center justify-center p-8">
      <div className="bg-white/10 backdrop-blur-lg rounded-2xl p-8 border border-white/20 max-w-2xl">
        <h1 className="text-3xl font-bold text-white mb-6 text-center">
          🔬 Curiosity Engine Test
        </h1>
        
        <div className="text-white/90 mb-8 space-y-4">
          <p>
            This test story contains <strong>25+ curiosity points</strong> that should glow with blue magical effects.
          </p>
          <p>
            Look for words like: <span className="text-blue-400 font-semibold">gravity, fossils, ecosystem, photosynthesis, volcano, crystals, DNA, bacteria, energy</span>, and many more!
          </p>
          <p>
            Click on any glowing word to summon <strong>Professor Nova</strong> for contextual insights.
          </p>
        </div>

        <button
          onClick={() => setShowStorybook(true)}
          className="w-full bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-bold py-4 px-8 rounded-xl transition-all duration-300 transform hover:scale-105"
        >
          🚀 Launch Curiosity Engine Test
        </button>
        
        <div className="mt-6 text-sm text-white/70">
          <p><strong>Expected Features:</strong></p>
          <ul className="list-disc list-inside mt-2 space-y-1">
            <li>Blue glowing words with sparkle effects</li>
            <li>Professor Nova popup when clicking curiosity points</li>
            <li>Contextual AI insights based on story content</li>
            <li>Grade-appropriate explanations</li>
          </ul>
        </div>
      </div>
    </div>
  )
}
