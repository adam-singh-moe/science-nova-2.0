import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { AnimatePresenceWrapper } from "@/components/layout/animate-presence-wrapper"
import { AppChrome } from "@/components/layout/app-chrome"

export const metadata: Metadata = {
  title: "Science Nova Lite",
  description: "Lite - AI-Powered Science Learning",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <AuthProvider>
          <AnimatePresenceWrapper>
            <AppChrome>
              {children}
            </AppChrome>
          </AnimatePresenceWrapper>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
