"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Settings, Bot } from "lucide-react"
import { theme } from "@/lib/theme"

interface FloatingChatSettings {
  enabled: boolean
  position: "bottom-right" | "bottom-left" | "top-right" | "top-left"
  autoOpen: boolean
}

interface FloatingChatSettingsProps {
  onSettingsChange?: (settings: FloatingChatSettings) => void
}

export function FloatingChatSettings({ onSettingsChange }: FloatingChatSettingsProps) {
  const [settings, setSettings] = useState<FloatingChatSettings>({
    enabled: true,
    position: "bottom-right",
    autoOpen: false,
  })

  // Load settings from localStorage on mount
  useEffect(() => {
    const savedSettings = localStorage.getItem('floating-chat-settings')
    if (savedSettings) {
      try {
        const parsed = JSON.parse(savedSettings)
        setSettings(parsed)
      } catch (error) {
        console.error('Failed to parse floating chat settings:', error)
      }
    }
  }, [])

  // Save settings to localStorage and notify parent
  const updateSettings = (newSettings: Partial<FloatingChatSettings>) => {
    const updatedSettings = { ...settings, ...newSettings }
    setSettings(updatedSettings)
    localStorage.setItem('floating-chat-settings', JSON.stringify(updatedSettings))
    onSettingsChange?.(updatedSettings)
  }

  return (
    <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2`}>
      <CardHeader>
        <CardTitle className={`${theme.text.primary} flex items-center gap-2`}>
          <Settings className={`h-5 w-5 ${theme.icon.primary}`} />
          AI Assistant Settings
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Enable/Disable Floating Chat */}
        <div className="flex items-center justify-between">
          <div className="space-y-1">
            <Label htmlFor="floating-chat-enabled" className={`${theme.text.primary} font-medium`}>
              Show Floating AI Assistant
            </Label>
            <p className={`text-sm ${theme.text.secondary}`}>
              Display the AI assistant button on all pages
            </p>
          </div>
          <Switch
            id="floating-chat-enabled"
            checked={settings.enabled}
            onCheckedChange={(enabled) => updateSettings({ enabled })}
          />
        </div>

        {/* Position Selection */}
        {settings.enabled && (
          <div className="space-y-3">
            <Label className={`${theme.text.primary} font-medium`}>
              Position on Screen
            </Label>
            <RadioGroup
              value={settings.position}
              onValueChange={(position) => updateSettings({ position: position as any })}
              className="grid grid-cols-2 gap-3"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bottom-right" id="bottom-right" />
                <Label htmlFor="bottom-right" className={`text-sm ${theme.text.secondary}`}>
                  Bottom Right
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="bottom-left" id="bottom-left" />
                <Label htmlFor="bottom-left" className={`text-sm ${theme.text.secondary}`}>
                  Bottom Left
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="top-right" id="top-right" />
                <Label htmlFor="top-right" className={`text-sm ${theme.text.secondary}`}>
                  Top Right
                </Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="top-left" id="top-left" />
                <Label htmlFor="top-left" className={`text-sm ${theme.text.secondary}`}>
                  Top Left
                </Label>
              </div>
            </RadioGroup>
          </div>
        )}

        {/* Auto-open Setting */}
        {settings.enabled && (
          <div className="flex items-center justify-between">
            <div className="space-y-1">
              <Label htmlFor="auto-open" className={`${theme.text.primary} font-medium`}>
                Auto-open on New Pages
              </Label>
              <p className={`text-sm ${theme.text.secondary}`}>
                Automatically open the chat when visiting new pages
              </p>
            </div>
            <Switch
              id="auto-open"
              checked={settings.autoOpen}
              onCheckedChange={(autoOpen) => updateSettings({ autoOpen })}
            />
          </div>
        )}

        {/* Preview */}
        <div className="space-y-3">
          <Label className={`${theme.text.primary} font-medium`}>
            Preview
          </Label>
          <div className="relative h-32 bg-gradient-to-br from-blue-50 to-purple-50 rounded-lg border-2 border-dashed border-gray-300 overflow-hidden">
            {settings.enabled && (
              <div className={`absolute ${
                settings.position === "bottom-right" ? "bottom-2 right-2" :
                settings.position === "bottom-left" ? "bottom-2 left-2" :
                settings.position === "top-right" ? "top-2 right-2" :
                "top-2 left-2"
              }`}>
                <div className={`w-8 h-8 rounded-full ${theme.gradient.primary} flex items-center justify-center border border-white/20 shadow-lg`}>
                  <Bot className="h-4 w-4 text-white" />
                </div>
              </div>
            )}
            <div className="absolute inset-0 flex items-center justify-center">
              <p className={`text-sm ${theme.text.muted}`}>
                {settings.enabled ? "AI Assistant will appear here" : "AI Assistant disabled"}
              </p>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}
