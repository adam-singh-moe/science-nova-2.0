"use client"

// Test component to isolate import issues
import { ContentGrid } from "@/components/topic/content-grid"
import { MissionComplete } from "@/components/topic/mission-complete"

export default function TestPage() {
  return (
    <div className="min-h-screen">
      <div className="p-8">
        <h1 className="text-2xl font-bold mb-4">Mission Complete Demo</h1>
        <p className="mb-8">Scroll down to test the Mission Complete feature!</p>
        
        {/* Extended content to demonstrate scrolling */}
        <ContentGrid 
          content="# Forces and Motion - Lesson 1

Welcome to an exciting journey into the world of physics! In this lesson, we'll explore how things move and what makes them change direction.

## Key Concept: What is Force?

A force is a push or a pull that can make objects move, stop, or change direction. Think about kicking a soccer ball - your foot applies a force to make the ball move!

## Fun Fact

Did you know that it takes more force to start moving a heavy object than to keep it moving? This is why it's harder to push a car from a standstill than to keep pushing it once it's already rolling!

## Interactive Diagram: Types of Forces

Imagine a diagram showing different types of forces - gravity pulling an apple down, friction slowing down a sliding box, and applied force pushing a shopping cart.

## More Content

Forces are everywhere around us! When you walk, you apply force to the ground, and the ground pushes back with an equal force. This is Newton's Third Law of Motion.

## Another Key Concept: Gravity

Gravity is a special type of force that pulls objects toward each other. On Earth, gravity pulls everything toward the center of our planet.

## Fun Fact About Motion

The fastest land animal, the cheetah, can reach speeds of up to 70 mph (112 km/h) in short bursts! That's the result of powerful muscle forces overcoming air resistance and friction.

## Practice Questions

1. What force keeps you on the ground?
2. What happens when you push a ball?
3. Why do things eventually stop moving when you stop pushing them?

## Summary

Forces are pushes and pulls that make things move, stop, or change direction. Understanding forces helps us understand how the world around us works!"
          flashcards={[
            {
              id: "1",
              front: "What is a force?",
              back: "A push or pull that can make objects move, stop, or change direction"
            },
            {
              id: "2", 
              front: "What is gravity?",
              back: "A force that pulls objects toward each other, especially toward the center of Earth"
            }
          ]}
        />

        {/* Add lots of spacing to make scrolling necessary */}
        <div className="space-y-8 mt-16">
          <div className="bg-blue-50 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Additional Learning</h3>
            <p>Continue exploring physics concepts to deepen your understanding!</p>
          </div>
          
          <div className="bg-green-50 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Real-World Applications</h3>
            <p>Engineers use knowledge of forces to design cars, bridges, and roller coasters!</p>
          </div>
          
          <div className="bg-purple-50 p-6 rounded-lg">
            <h3 className="font-bold text-lg mb-2">Next Steps</h3>
            <p>In the next lesson, we'll explore Newton's Laws of Motion in more detail.</p>
          </div>
          
          {/* Add more content to ensure scrolling */}
          <div className="space-y-4">
            <p className="text-gray-600">Keep scrolling to see the Mission Complete feature...</p>
            <div className="h-20 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-500">More content here...</span>
            </div>
            <div className="h-20 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-500">Almost there...</span>
            </div>
            <div className="h-20 bg-gray-100 rounded flex items-center justify-center">
              <span className="text-gray-500">Just a bit more...</span>
            </div>
            <div className="h-32 bg-gradient-to-b from-gray-100 to-white rounded flex items-center justify-center">
              <span className="text-gray-500">🎉 You're about to complete the mission! 🎉</span>
            </div>
          </div>
        </div>
      </div>
      
      {/* Mission Complete Component - placed at the bottom */}
      <MissionComplete
        topicTitle="Forces and Motion - Lesson 1"
        grade="4th-grade"
        area="forces-and-motion"
        onComplete={() => {
          console.log("Mission completed! 🎉")
        }}
      />
    </div>
  )
}
