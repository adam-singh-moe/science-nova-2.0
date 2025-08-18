"use client"

import { useToast } from "@/hooks/use-toast"
import { Toast, ToastClose, ToastDescription, ToastProvider, ToastTitle, ToastViewport } from "@/components/ui/toast"
import { CheckCircle2, Info, AlertTriangle, XCircle } from "lucide-react"

export function Toaster() {
  const { toasts } = useToast()

  return (
    <ToastProvider>
      {toasts.map(function ({ id, title, description, action, variant, ...props }) {
        const Icon = variant === 'destructive' ? XCircle : variant === 'warning' ? AlertTriangle : variant === 'success' ? CheckCircle2 : Info
        return (
          <Toast key={id} variant={variant} {...props}>
            <div className="flex items-start gap-3">
              <div className="mt-0.5"><Icon className="h-5 w-5 opacity-90" /></div>
              <div className="grid gap-1">
              {title && <ToastTitle>{title}</ToastTitle>}
              {description && (
                <ToastDescription>{description}</ToastDescription>
              )}
              </div>
            </div>
            {action}
            <ToastClose />
          </Toast>
        )
      })}
      <ToastViewport />
    </ToastProvider>
  )
}
