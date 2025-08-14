import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const { topicId } = await request.json()
    
    // Mock implementation - return static content data
    console.log('📖 Generate Content API called with mock data for topic:', topicId)
    
    // Static mock content based on topic
    const mockContent = {
      1: { // Physics
        title: "Introduction to Physics",
        content: "Physics is the study of matter, energy, and their interactions. In this lesson, we'll explore fundamental concepts like force, motion, and energy through engaging examples and interactive demonstrations.",
        sections: [
          {
            title: "What is Physics?",
            content: "Physics helps us understand how the universe works, from the smallest particles to the largest galaxies."
          },
          {
            title: "Forces and Motion",
            content: "Everything around us is affected by forces. When you push a door, walk, or ride a bike, you're experiencing physics in action!"
          }
        ]
      },
      2: { // Biology
        title: "Living Systems",
        content: "Biology is the study of life and living organisms. We'll discover how plants and animals survive, grow, and interact with their environment.",
        sections: [
          {
            title: "What Makes Something Alive?",
            content: "Living things grow, reproduce, respond to their environment, and use energy."
          },
          {
            title: "Ecosystems",
            content: "All living things depend on each other and their environment to survive."
          }
        ]
      },
      3: { // Chemistry
        title: "Chemical Reactions",
        content: "Chemistry studies matter and how it changes. Learn about atoms, molecules, and the amazing reactions that happen all around us.",
        sections: [
          {
            title: "Atoms and Elements", 
            content: "Everything is made of tiny building blocks called atoms. Different types of atoms are called elements."
          },
          {
            title: "Chemical Changes",
            content: "When substances combine or break apart, we get chemical reactions - like baking a cake or rusting metal!"
          }
        ]
      }
    }

    const content = mockContent[topicId as keyof typeof mockContent] || {
      title: "Science Exploration",
      content: "Discover the wonders of science through hands-on learning and exploration.",
      sections: [
        {
          title: "Scientific Method",
          content: "Science is about asking questions, making observations, and testing ideas."
        }
      ]
    }

    return NextResponse.json({ 
      content,
      message: "Mock content generated successfully" 
    })

  } catch (error) {
    console.error('❌ Generate Content API error:', error)
    return NextResponse.json(
      { error: "Failed to generate content" },
      { status: 500 }
    )
  }
}
