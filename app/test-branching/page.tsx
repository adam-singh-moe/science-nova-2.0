"use client"

import { useState } from 'react'
import { Storybook } from '@/components/ui/storybook-enhanced'
import { Button } from '@/components/ui/button'

const branchingStoryData = {
  title: "The Mysterious Cave Adventure",
  pages: [
    {
      id: "start",
      content: "You are exploring a forest when you discover a mysterious cave entrance. The air is cool and you can hear strange sounds echoing from within. A wooden sign next to the entrance reads: 'Danger - Ancient Mysteries Await!'",
      backgroundPrompt: "A dark mysterious cave entrance in a lush forest, sunlight filtering through trees",
      choices: [
        { text: "Enter the cave immediately - you're feeling brave!", nextPageId: "enter-brave", consequences: ["Gained courage"] },
        { text: "Look for equipment first - better to be prepared", nextPageId: "find-equipment", consequences: ["Found backpack", "Gained supplies"] },
        { text: "Turn back - this seems too dangerous", nextPageId: "turn-back", consequences: ["Gained wisdom"] }
      ],
      progressWeight: 0.15
    },
    {
      id: "enter-brave",
      content: "You boldly step into the dark cave! Your eyes slowly adjust to the darkness. You see two tunnels ahead - one going down deeper into the earth, and another that seems to curve upward toward dim light.",
      backgroundPrompt: "Inside a dark cave with two tunnel entrances, mysterious shadows and rocky walls",
      choices: [
        { text: "Take the tunnel going deeper down", nextPageId: "deep-tunnel", consequences: ["Showed bravery"] },
        { text: "Follow the tunnel toward the light", nextPageId: "light-tunnel", consequences: ["Used good judgment"] }
      ],
      dynamicChoicePrompt: "The student is in a dark cave with limited visibility, having entered without equipment. Generate choices that reflect their current situation and past decision to enter bravely.",
      progressWeight: 0.2
    },
    {
      id: "find-equipment",
      content: "Smart thinking! You search around and find an old backpack with a flashlight, rope, and some emergency supplies. Now you feel much more prepared for whatever awaits inside the cave.",
      backgroundPrompt: "An old backpack with camping equipment, flashlight and rope near a cave entrance",
      choices: [
        { text: "Enter the cave with your equipment", nextPageId: "enter-prepared", consequences: ["Used flashlight"] },
        { text: "Mark the location and return with friends", nextPageId: "return-later", consequences: ["Made map", "Showed responsibility"] }
      ],
      collectibles: [
        { id: "flashlight", name: "Flashlight", description: "A reliable source of light for dark exploration" },
        { id: "rope", name: "Climbing Rope", description: "Essential for navigating steep cave passages" },
        { id: "backpack", name: "Explorer's Backpack", description: "Contains useful supplies for adventures" }
      ],
      progressWeight: 0.2
    },
    {
      id: "turn-back",
      content: "Sometimes the wisest choice is knowing when not to take a risk. You mark the cave location on your map and head back to town. Later, you organize a proper expedition with experienced cavers and safety equipment. The cave's mysteries will have to wait for another day!",
      backgroundPrompt: "A person walking away from a cave entrance, marking location on a map",
      collectibles: [
        { id: "map", name: "Cave Location Map", description: "A map marking the mysterious cave's location" }
      ],
      progressWeight: 1.0
    },
    {
      id: "deep-tunnel",
      content: "You venture deeper into the earth. The tunnel opens into a vast underground chamber filled with glowing crystals! The walls sparkle like stars, and you hear the gentle sound of an underground stream. You've discovered an amazing crystal cavern!",
      backgroundPrompt: "A magnificent underground crystal cavern with glowing blue and purple crystals",
      collectibles: [
        { id: "crystal", name: "Glowing Crystal", description: "A beautiful crystal that emits a soft, natural light" }
      ],
      dynamicChoicePrompt: "The student has discovered a magnificent crystal cavern. Generate choices that let them explore this geological wonder scientifically.",
      progressWeight: 0.8
    },
    {
      id: "light-tunnel", 
      content: "Following the light leads you to an incredible discovery - an ancient underground garden! Bioluminescent plants create a magical glow, and you see evidence that someone once lived here long ago. What an amazing find!",
      backgroundPrompt: "An underground garden with glowing plants and ancient stone structures",
      collectibles: [
        { id: "glowing-plant", name: "Bioluminescent Plant Sample", description: "A unique plant that creates its own light through natural processes" }
      ],
      dynamicChoicePrompt: "The student has found an ancient underground garden with bioluminescent plants. Generate choices that involve botanical exploration and understanding ancient civilizations.",
      progressWeight: 0.8
    },
    {
      id: "enter-prepared",
      content: "With your flashlight guiding the way, you explore safely and methodically. You discover ancient cave paintings on the walls - evidence of people who lived here thousands of years ago! Your preparation paid off as you document this incredible archaeological discovery.",
      backgroundPrompt: "Ancient cave paintings illuminated by flashlight beam, showing primitive art and symbols",
      collectibles: [
        { id: "painting-photo", name: "Cave Painting Documentation", description: "Photographs of ancient cave art showing early human civilization" }
      ],
      progressWeight: 0.9
    },
    {
      id: "return-later",
      content: "You return to town and organize a proper scientific expedition. A few weeks later, you lead a team of archaeologists and geologists back to the cave. Together, you make groundbreaking discoveries about ancient civilizations. Your caution and leadership made this success possible!",
      backgroundPrompt: "A scientific expedition team with equipment studying cave formations and ancient artifacts",
      collectibles: [
        { id: "expedition-report", name: "Scientific Expedition Report", description: "Official documentation of the cave's archaeological significance" }
      ],
      progressWeight: 1.0
    }
  ]
}

export default function BranchingStoryTest() {
  const [showStorybook, setShowStorybook] = useState(false)

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-900 via-purple-900 to-indigo-900 flex items-center justify-center p-8">
      {!showStorybook ? (
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white mb-8">
            Branching Narrative Demo
          </h1>
          <p className="text-xl text-white/80 mb-8 max-w-2xl">
            Experience a choose-your-own-adventure story with multiple paths and endings!
          </p>
          <Button
            onClick={() => setShowStorybook(true)}
            className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 py-4 text-lg font-semibold rounded-xl shadow-lg hover:shadow-xl transition-all duration-300"
          >
            🏞️ Start the Cave Adventure
          </Button>
        </div>
      ) : (
        <Storybook
          pages={branchingStoryData.pages}
          title={branchingStoryData.title}
          onClose={() => setShowStorybook(false)}
        />
      )}
    </div>
  )
}
