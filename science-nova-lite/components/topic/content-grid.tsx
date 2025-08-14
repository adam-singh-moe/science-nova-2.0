"use client"

import { useMemo } from "react"
import { KeyConceptCard, FunFactCard, InteractiveDiagramCard, FlashcardDeckCard } from "./content-cards"
import type { KeyConcept, FunFact, InteractiveDiagram, FlashcardData } from "./content-cards"

interface ContentGridProps {
  content: string
  flashcards?: FlashcardData[]
}

export function ContentGrid({ content, flashcards = [] }: ContentGridProps) {
  const parsedContent = useMemo(() => {
    const cards: Array<{
      type: 'concept' | 'funfact' | 'diagram'
      data: KeyConcept | FunFact | InteractiveDiagram
      order: number
    }> = []

    const sections = content.split(/\n\n+/).filter(section => section.trim())
    let order = 0

    sections.forEach((section, index) => {
      const cleanSection = section.trim()
      if (!cleanSection) return

      if (/\b(fun fact|did you know|amazing|incredible|surprisingly|interestingly)\b/i.test(cleanSection)) {
        cards.push({ type: 'funfact', data: { id: `funfact-${index}`, fact: cleanSection.replace(/^(fun fact:?\s*|did you know:?\s*)/i, '') } as FunFact, order: order++ })
        return
      }

      if (/\b(image|diagram|picture|illustration|figure|chart|graph)\b/i.test(cleanSection) || cleanSection.includes('<img') || /\.(jpg|jpeg|png|gif|svg|webp)/i.test(cleanSection)) {
        const imgMatch = cleanSection.match(/src=['"](.*?)['"]/)
          || cleanSection.match(/(https?:\/\/.*?\.(jpg|jpeg|png|gif|svg|webp))/i)
        const imageUrl = imgMatch ? imgMatch[1] : '/placeholder-diagram.jpg'
        cards.push({ type: 'diagram', data: { id: `diagram-${index}`, imageUrl, title: cleanSection.replace(/<[^>]*>/g, '').substring(0, 50) + '...', hotspots: [ { x: 25, y: 30, label: "Key Feature", description: "This is an important part of the diagram." }, { x: 75, y: 45, label: "Detail", description: "Click to learn more about this component." }, { x: 50, y: 70, label: "Process", description: "This shows how the process works." } ] } as InteractiveDiagram, order: order++ })
        return
      }

      if (cleanSection.length > 50 && (cleanSection.startsWith('#') || /\b(important|key|main|primary|essential|fundamental)\b/i.test(cleanSection) || cleanSection.split(' ').length > 10)) {
        let title = ''
        let conceptContent = cleanSection
        if (cleanSection.startsWith('#')) {
          const headerMatch = cleanSection.match(/^#+\s*(.+?)(?:\n|$)/)
          if (headerMatch) {
            title = headerMatch[1]
            conceptContent = cleanSection.replace(/^#+\s*.+?(?:\n|$)/, '').trim()
          }
        } else {
          const sentences = cleanSection.split(/[.!?]+/)
          title = sentences[0]?.substring(0, 60) + (sentences[0]?.length > 60 ? '...' : '')
          conceptContent = sentences.slice(1).join('. ').trim()
        }
        if (!title) title = `Key Concept ${index + 1}`
        if (!conceptContent) conceptContent = cleanSection
        cards.push({ type: 'concept', data: { id: `concept-${index}`, title, content: conceptContent, icon: 'book' } as KeyConcept, order: order++ })
        return
      }

      if (cleanSection.length > 20) {
        cards.push({ type: 'concept', data: { id: `concept-${index}`, title: `Learning Point ${index + 1}`, content: cleanSection, icon: 'book' } as KeyConcept, order: order++ })
      }
    })

    return cards.sort((a, b) => a.order - b.order)
  }, [content])

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 auto-rows-fr">
        {parsedContent.map((card) => {
          switch (card.type) {
            case 'concept':
              return (<KeyConceptCard key={card.data.id} concept={card.data as KeyConcept} />)
            case 'funfact':
              return (<FunFactCard key={card.data.id} funFact={card.data as FunFact} />)
            case 'diagram':
              return (
                <div key={card.data.id} className="md:col-span-2">
                  <InteractiveDiagramCard diagram={card.data as InteractiveDiagram} />
                </div>
              )
            default:
              return null
          }
        })}
        {flashcards.length > 0 && (
          <div className="md:col-span-2 lg:col-span-1">
            <FlashcardDeckCard flashcards={flashcards} />
          </div>
        )}
      </div>
      {parsedContent.length === 0 && (
        <div className="text-center py-12">
          <div className="text-6xl mb-4">📚</div>
          <h3 className="text-xl font-bold text-gray-600 mb-2">Content Loading...</h3>
          <p className="text-gray-500">The lesson content will appear here once it's processed.</p>
        </div>
      )}
    </div>
  )
}
