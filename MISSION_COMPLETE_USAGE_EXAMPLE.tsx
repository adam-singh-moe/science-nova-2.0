// Example usage in a topic page: app/topics/4th-grade/forces-and-motion/lesson-1/page.tsx

"use client"

import { ContentGrid } from "@/components/topic/content-grid"
import { TopicLayout } from "@/components/topic/topic-layout"

export default function ForcesAndMotionLesson1() {
  const lessonContent = `# Forces and Motion - Understanding Push and Pull

Welcome to your first lesson on forces and motion! 🚀

## Key Concept: What is a Force?

A force is simply a push or a pull. Forces are everywhere around us and they make things happen in our world!

## Fun Fact: Invisible Forces

Did you know that right now, gravity is pulling you toward the center of the Earth with a force equal to your weight? You can't see it, but it's always there!

## Interactive Diagram: Types of Forces

[This would show an interactive diagram with different force examples - a person pushing a box, gravity pulling an apple, friction slowing down a sliding object]

## Key Concept: Motion and Rest

Objects at rest tend to stay at rest, and objects in motion tend to stay in motion. This is called inertia!

## Fun Fact: Space Motion

In space, where there's no air resistance, a moving object would keep moving forever in the same direction unless something stops it!

## Practice Time

Think about these examples:
- Kicking a soccer ball (applied force)
- A book sitting on a table (gravity vs. normal force)  
- Rubbing your hands together (friction force)

## Vocabulary Review

Use the flashcards below to review key terms from this lesson.

Great job exploring forces and motion! You're becoming a real physicist! 🌟`

  const flashcards = [
    {
      id: "force",
      front: "What is a force?", 
      back: "A push or a pull that can change an object's motion"
    },
    {
      id: "gravity",
      front: "What is gravity?",
      back: "A force that pulls objects toward the center of the Earth"
    },
    {
      id: "friction", 
      front: "What is friction?",
      back: "A force that opposes motion between two surfaces in contact"
    },
    {
      id: "inertia",
      front: "What is inertia?",
      back: "The tendency of objects to resist changes in their motion"
    }
  ]

  return (
    <TopicLayout
      topicTitle="Forces and Motion - Understanding Push and Pull"
      grade="4th-grade"
      area="forces-and-motion"
    >
      <div className="space-y-8">
        {/* Header */}
        <header className="text-center">
          <h1 className="text-4xl font-fredoka font-bold text-blue-800 mb-2">
            Forces and Motion
          </h1>
          <p className="text-xl font-comic text-green-700">
            Lesson 1: Understanding Push and Pull
          </p>
          <div className="flex justify-center gap-2 mt-4">
            <span className="bg-blue-100 text-blue-800 px-3 py-1 rounded-full text-sm font-bold">
              4th Grade
            </span>
            <span className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-bold">
              Physics
            </span>
            <span className="bg-purple-100 text-purple-800 px-3 py-1 rounded-full text-sm font-bold">
              30 min
            </span>
          </div>
        </header>

        {/* Main Content */}
        <ContentGrid 
          content={lessonContent}
          flashcards={flashcards}
        />

        {/* Additional Activities */}
        <section className="bg-gradient-to-r from-blue-50 to-green-50 rounded-2xl p-8 border-2 border-blue-200">
          <h2 className="text-2xl font-fredoka font-bold text-blue-800 mb-4">
            🎯 Try This at Home!
          </h2>
          <div className="grid md:grid-cols-2 gap-6">
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg mb-2">🏀 Ball Experiment</h3>
              <p className="text-gray-700">
                Roll different balls across the floor. Which one travels the farthest? 
                Think about friction and the force you applied!
              </p>
            </div>
            <div className="bg-white rounded-xl p-6 shadow-md">
              <h3 className="font-bold text-lg mb-2">📚 Book Balance</h3>
              <p className="text-gray-700">
                Stack books on your head and try to walk. What forces are at work 
                to keep them balanced?
              </p>
            </div>
          </div>
        </section>

        {/* Learning Objectives Summary */}
        <section className="bg-gradient-to-r from-yellow-50 to-orange-50 rounded-2xl p-8 border-2 border-yellow-200">
          <h2 className="text-2xl font-fredoka font-bold text-orange-800 mb-4">
            🎓 What You've Learned
          </h2>
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center">
              <div className="w-12 h-12 bg-yellow-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">💪</span>
              </div>
              <p className="font-bold">Forces are pushes and pulls</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-orange-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">🌍</span>
              </div>
              <p className="font-bold">Gravity pulls everything down</p>
            </div>
            <div className="text-center">
              <div className="w-12 h-12 bg-red-400 rounded-full flex items-center justify-center mx-auto mb-2">
                <span className="text-2xl">⚡</span>
              </div>
              <p className="font-bold">Objects resist changing motion</p>
            </div>
          </div>
        </section>
      </div>
    </TopicLayout>
  )
}
