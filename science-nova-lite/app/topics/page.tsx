import { Navbar } from "@/components/layout/navbar"
import { PageTransition } from "@/components/layout/page-transition"
import { VantaBackground } from "@/components/vanta-background"
import { TopicsPage } from "@/components/pages/topics-page"

export default function Topics() {
  return (
    <VantaBackground>
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <PageTransition>
          <TopicsPage />
        </PageTransition>
      </main>
    </VantaBackground>
  )
}
