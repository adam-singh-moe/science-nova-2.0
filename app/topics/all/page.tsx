"use client"

import { VantaBackground } from "@/components/vanta-background"
import { Navbar } from "@/components/layout/navbar"
import { AllTopicsPage } from "@/components/pages/all-topics-page"

export default function AllTopics() {
  return (
    <>
      <VantaBackground />
      <Navbar />
      <div className="pt-20">
        <AllTopicsPage />
      </div>
    </>
  )
}
