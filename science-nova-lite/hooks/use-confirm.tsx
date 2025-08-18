"use client"

import React, { createContext, useCallback, useContext, useState } from "react"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Button } from "@/components/ui/button"

type ConfirmOptions = {
  title?: React.ReactNode
  description?: React.ReactNode
  actionText?: string
  cancelText?: string
  variant?: "default" | "destructive" | "primary"
}

type ConfirmContextType = (options?: ConfirmOptions) => Promise<boolean>

const ConfirmContext = createContext<ConfirmContextType | null>(null)

export function ConfirmProvider({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false)
  const [opts, setOpts] = useState<ConfirmOptions>({})
  const [resolver, setResolver] = useState<((v: boolean) => void) | null>(null)

  const confirm = useCallback((options?: ConfirmOptions) => {
    setOpts(options || {})
    setOpen(true)
    return new Promise<boolean>((resolve) => setResolver(() => resolve))
  }, [])

  const handleClose = (value: boolean) => {
    setOpen(false)
    resolver?.(value)
    setResolver(null)
  }

  return (
    <ConfirmContext.Provider value={confirm}>
      {children}
      <Dialog open={open} onOpenChange={(o)=>{ if (!o) handleClose(false) }}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>{opts.title ?? "Are you sure?"}</DialogTitle>
            {opts.description && (
              <DialogDescription>{opts.description}</DialogDescription>
            )}
          </DialogHeader>
          <DialogFooter className="mt-2">
            <Button variant="outline" onClick={() => handleClose(false)}>
              {opts.cancelText ?? "Cancel"}
            </Button>
            <Button
              variant={opts.variant === "destructive" ? "destructive" : "default"}
              onClick={() => handleClose(true)}
            >
              {opts.actionText ?? "Confirm"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmContext.Provider>
  )
}

export function useConfirm() {
  const ctx = useContext(ConfirmContext)
  if (!ctx) throw new Error("useConfirm must be used within ConfirmProvider")
  return ctx
}
