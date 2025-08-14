"use client"

import { VantaBackground } from "@/components/vanta-background"
import { Navbar } from "@/components/layout/navbar"
import { AchievementsPage } from "@/components/pages/achievements-page"

export default function Achievements() {
  return (
    <>
      <VantaBackground />
      <Navbar />
      <div className="pt-20">
        <AchievementsPage />
      </div>
    </>
  )
}
