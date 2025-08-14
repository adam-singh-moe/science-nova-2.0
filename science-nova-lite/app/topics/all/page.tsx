import { Navbar } from "@/components/layout/navbar"
import { PageTransition } from "@/components/layout/page-transition"
import { VantaBackground } from "@/components/vanta-background"
import { AllTopicsPage } from "@/components/pages/all-topics-page"

export default function AllTopics() {
  return (
    <VantaBackground>
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <PageTransition>
          <AllTopicsPage />
        </PageTransition>
      </main>
    </VantaBackground>
  )
}
