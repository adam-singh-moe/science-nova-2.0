"use client"

import { VantaBackground } from "@/components/vanta-background"
import { Navbar } from "@/components/layout/navbar"
import { TopicsPage } from "@/components/pages/topics-page"
import { PageTransition } from "@/components/layout/page-transition"

export default function Topics() {
  return (
    <>
      <VantaBackground />
      <Navbar />
      <PageTransition className="pt-20">
        <TopicsPage />
      </PageTransition>
    </>
  )
}
