'use client'

import React, { useEffect } from 'react'
import { X } from 'lucide-react'
import { Button } from './button'

interface ModalProps {
  isOpen: boolean
  onClose: () => void
  children: React.ReactNode
  title?: string
  size?: 'sm' | 'md' | 'lg' | 'xl' | 'full'
}

export function Modal({ isOpen, onClose, children, title, size = 'lg' }: ModalProps) {
  // Handle escape key
  useEffect(() => {
    const handleEscape = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        onClose()
      }
    }

    if (isOpen) {
      document.addEventListener('keydown', handleEscape)
      document.body.style.overflow = 'hidden'
    }

    return () => {
      document.removeEventListener('keydown', handleEscape)
      document.body.style.overflow = 'unset'
    }
  }, [isOpen, onClose])

  if (!isOpen) return null

  const sizeClasses = {
    sm: 'max-w-md',
    md: 'max-w-lg', 
    lg: 'max-w-2xl',
    xl: 'max-w-4xl',
    full: 'max-w-7xl'
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Enhanced Backdrop */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-black/80 via-black/70 to-black/80 backdrop-blur-md"
        onClick={onClose}
      />
      
      {/* Enhanced Modal Content */}
      <div className={`relative w-full ${sizeClasses[size]} max-h-[95vh] overflow-hidden rounded-3xl bg-gradient-to-br from-white/[0.15] via-white/[0.08] to-white/[0.12] backdrop-blur-xl border border-white/30 shadow-[0_25px_50px_-12px_rgba(0,0,0,0.5)] ring-1 ring-white/20`}>
        {/* Enhanced Header */}
        {title && (
          <div className="relative bg-gradient-to-r from-white/[0.08] to-white/[0.05] border-b border-white/20 backdrop-blur-sm">
            <div className="flex items-center justify-between p-6">
              <h2 className="text-2xl font-bold bg-gradient-to-r from-white to-white/80 bg-clip-text text-transparent drop-shadow-[0_2px_12px_rgba(0,0,0,0.8)] tracking-tight">
                {title}
              </h2>
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="rounded-full p-2 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/30 backdrop-blur-sm shadow-lg"
              >
                <X className="h-5 w-5" />
              </Button>
            </div>
            {/* Subtle gradient line */}
            <div className="absolute bottom-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-white/30 to-transparent"></div>
          </div>
        )}
        
        {/* Enhanced Content Area */}
        <div className="overflow-y-auto max-h-[calc(95vh-100px)] scrollbar-thin scrollbar-track-white/5 scrollbar-thumb-white/20 hover:scrollbar-thumb-white/30">
          <div className="bg-gradient-to-b from-transparent via-white/[0.02] to-transparent">
            {children}
          </div>
        </div>
        
        {/* Enhanced Close button if no title */}
        {!title && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            className="absolute top-4 right-4 rounded-full p-2 hover:bg-white/20 text-white/70 hover:text-white transition-all duration-300 border border-white/10 hover:border-white/30 backdrop-blur-sm shadow-lg z-10"
          >
            <X className="h-5 w-5" />
          </Button>
        )}
      </div>
    </div>
  )
}