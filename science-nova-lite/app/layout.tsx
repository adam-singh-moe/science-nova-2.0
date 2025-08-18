import type React from "react"
import type { Metadata } from "next"
import "./globals.css"
import { AuthProvider } from "@/contexts/auth-context"
import { Toaster } from "@/components/ui/toaster"
import { AnimatePresenceWrapper } from "@/components/layout/animate-presence-wrapper"
import { AppChrome } from "@/components/layout/app-chrome"
import { ConfirmProvider } from "@/hooks/use-confirm"

export const metadata: Metadata = {
  title: "Science Nova Lite",
  description: "Lite - AI-Powered Science Learning",
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
  <html lang="en" suppressHydrationWarning>
      <body>
        <AuthProvider>
          <ConfirmProvider>
            <AnimatePresenceWrapper>
              <AppChrome>
                {children}
              </AppChrome>
            </AnimatePresenceWrapper>
          </ConfirmProvider>
          <Toaster />
        </AuthProvider>
      </body>
    </html>
  )
}
