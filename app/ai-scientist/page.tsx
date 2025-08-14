"use client"

import { VantaBackground } from "@/components/vanta-background"
import { Navbar } from "@/components/layout/navbar"
import { AIScientistPage } from "@/components/pages/ai-scientist-page"
import { PageTransition } from "@/components/layout/page-transition"

export default function AIScientist() {
  return (
    <>
      <VantaBackground />
      <Navbar />
      <PageTransition variant="scientific" className="pt-20">
        <AIScientistPage />
      </PageTransition>
    </>
  )
}
