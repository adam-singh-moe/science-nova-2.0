"use client"

import { usePathname } from "next/navigation"
import { Navbar } from "@/components/layout/navbar"

export function AppChrome({ children }: { children: React.ReactNode }) {
  const pathname = usePathname()
  const hideNav = pathname?.startsWith("/admin")
  return (
    <>
      {!hideNav && <Navbar />}
      {children}
    </>
  )
}
