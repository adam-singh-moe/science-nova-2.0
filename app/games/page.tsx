"use client"

import { VantaBackground } from "@/components/vanta-background"
import { Navbar } from "@/components/layout/navbar"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Gamepad2, Zap } from "lucide-react"
import Link from "next/link"
import { Button } from "@/components/ui/button"

export default function Games() {
  return (
    <>
      <VantaBackground />
      <Navbar />
      <div className="min-h-screen pt-20 p-6">
        <div className="max-w-4xl mx-auto">
          <Card className="bg-white/95 border-gray-300 border-2">
            <CardHeader className="text-center">
              <Gamepad2 className="h-24 w-24 text-lime-400 mx-auto mb-4" />
              <CardTitle className="text-3xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-orange-400">
                Science Games
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center py-12">
              <h3 className="text-xl font-semibold text-yellow-400 mb-4">Game Zone Under Construction!</h3>
              <p className="text-lime-400 mb-6 max-w-2xl mx-auto">
                We're creating fun and educational science games that will make learning feel like play! Get ready for
                quizzes, puzzles, experiments, and interactive challenges that will test your knowledge and spark your
                curiosity.
              </p>
              <div className="flex gap-4 justify-center">
                <Link href="/">
                  <Button className="bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600 border border-gray-700">
                    Back to Home
                  </Button>
                </Link>
                <Link href="/ai-scientist">
                  <Button
                    variant="outline"
                    className="border-2 border-gray-700 text-lime-400 hover:bg-transparent hover:text-yellow-400"
                  >
                    <Zap className="h-4 w-4 mr-2" />
                    Chat with AI Scientist
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
