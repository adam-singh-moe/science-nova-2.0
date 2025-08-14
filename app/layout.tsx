import type React from "react"
import type { Metadata } from "next"
import { Inter } from "next/font/google"
import "./globals.css"
import { Toaster } from "@/components/ui/toaster"
import { FloatingAIChat } from "@/components/floating-ai-chat"
import { AuthProvider } from "@/contexts/auth-context"
import { CacheCleanupInitializer } from "@/components/cache-cleanup-initializer"
import { AnimatePresenceWrapper } from "@/components/layout/animate-presence-wrapper"

const inter = Inter({ subsets: ["latin"] })

export const metadata: Metadata = {
  title: "Science Nova - AI-Powered Science Learning",
  description: "Next-generation science education platform for primary school students",
    generator: 'v0.dev'
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <AnimatePresenceWrapper>
            {children}
          </AnimatePresenceWrapper>
          <Toaster />
          <FloatingAIChat />
          <CacheCleanupInitializer />
        </AuthProvider>
      </body>
    </html>
  )
}
