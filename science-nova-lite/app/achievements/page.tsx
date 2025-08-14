import { Navbar } from "@/components/layout/navbar"
import { PageTransition } from "@/components/layout/page-transition"
import { VantaBackground } from "@/components/vanta-background"
import { AchievementsPage } from "@/components/pages/achievements-page"

export default function Achievements() {
  return (
    <VantaBackground>
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <PageTransition>
          <AchievementsPage />
        </PageTransition>
      </main>
    </VantaBackground>
  )
}
