import { HomePage } from "@/components/pages/home-page"
import { Navbar } from "@/components/layout/navbar"
import { PageTransition } from "@/components/layout/page-transition"
import { VantaBackground } from "@/components/vanta-background"

export default function Page() {
  return (
    <VantaBackground>
      <Navbar />
      <main className="container mx-auto px-4 py-6">
        <PageTransition>
          <HomePage />
        </PageTransition>
      </main>
    </VantaBackground>
  )
}
