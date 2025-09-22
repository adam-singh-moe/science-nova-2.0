"use client"

import { Card } from "@/components/ui/card"
import { BarChart3, TrendingUp, Users, Zap } from "lucide-react"

interface ArcadeDiscoveryEngagementProps {
  data: {
    topics: any[]
    entries: any[]
  }
  loading: boolean
}

export function ArcadeDiscoveryEngagement({ data, loading }: ArcadeDiscoveryEngagementProps) {
  if (loading) {
    return (
      <Card className="p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-1/4 mb-4"></div>
          <div className="space-y-3">
            <div className="h-3 bg-gray-200 rounded w-1/2"></div>
            <div className="h-3 bg-gray-200 rounded w-1/3"></div>
            <div className="h-3 bg-gray-200 rounded w-1/4"></div>
          </div>
        </div>
      </Card>
    )
  }

  const totalEntries = data.entries?.length || 0
  const arcadeEntries = data.entries?.filter(entry => entry.category === 'ARCADE')?.length || 0
  const discoveryEntries = data.entries?.filter(entry => entry.category === 'DISCOVERY')?.length || 0

  return (
    <Card className="p-6">
      <div className="mb-6">
        <div className="flex items-center gap-2 mb-2">
          <Zap className="h-5 w-5 text-purple-600" />
          <h3 className="text-lg font-semibold text-gray-900">Interactive Content Overview</h3>
        </div>
        <p className="text-sm text-gray-600">
          Arcade games and discovery activities engagement metrics
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-gradient-to-r from-purple-50 to-purple-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-purple-600">Total Content</p>
              <p className="text-2xl font-bold text-purple-900">{totalEntries}</p>
            </div>
            <BarChart3 className="h-8 w-8 text-purple-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-indigo-50 to-indigo-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-indigo-600">Arcade Games</p>
              <p className="text-2xl font-bold text-indigo-900">{arcadeEntries}</p>
            </div>
            <Users className="h-8 w-8 text-indigo-600" />
          </div>
        </div>

        <div className="bg-gradient-to-r from-green-50 to-green-100 rounded-lg p-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-green-600">Discovery Activities</p>
              <p className="text-2xl font-bold text-green-900">{discoveryEntries}</p>
            </div>
            <TrendingUp className="h-8 w-8 text-green-600" />
          </div>
        </div>
      </div>

      {totalEntries === 0 ? (
        <div className="text-center py-8">
          <div className="text-gray-400 mb-2">
            <BarChart3 className="h-12 w-12 mx-auto" />
          </div>
          <h4 className="text-sm font-medium text-gray-900 mb-1">No content available</h4>
          <p className="text-sm text-gray-500">Create arcade games or discovery activities to see engagement data here.</p>
        </div>
      ) : (
        <div className="space-y-4">
          <h4 className="font-medium text-gray-900">Recent Activity</h4>
          <div className="space-y-2">
            {data.entries?.slice(0, 5).map((entry, index) => (
              <div key={index} className="flex items-center justify-between p-3 rounded-lg border border-gray-100 hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-lg ${
                    entry.category === 'ARCADE' 
                      ? 'bg-purple-100 text-purple-600' 
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {entry.category === 'ARCADE' ? '🎮' : '🔍'}
                  </div>
                  <div>
                    <p className="font-medium text-gray-900">{entry.title || 'Untitled'}</p>
                    <p className="text-sm text-gray-500">{entry.category} • {entry.subtype || 'General'}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">{entry.status || 'Active'}</p>
                  <p className="text-xs text-gray-500">Grade {entry.grade_level || '—'}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Card>
  )
}