"use client"

import { HomePage } from "@/components/pages/home-page"
import { VantaBackground } from "@/components/vanta-background"
import { Navbar } from "@/components/layout/navbar"
import { PageTransition } from "@/components/layout/page-transition"

export default function Home() {
  return (
    <>
      <VantaBackground />
      <Navbar />
      <PageTransition className="pt-20">
        <HomePage />
      </PageTransition>
    </>
  )
}
