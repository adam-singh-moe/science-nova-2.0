import { useState, useEffect } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Separator } from '@/components/ui/separator'

interface HealthStats {
  status: string
  database: {
    status: 'healthy' | 'degraded' | 'unhealthy'
    latency: number
    connections: any
  }
  cache: {
    size: number
    maxSize: number
    hitRatio: number
  }
  responseTime: number
  timestamp: string
}

interface PerformanceMonitorProps {
  className?: string
}

export function PerformanceMonitor({ className }: PerformanceMonitorProps) {
  const [healthStats, setHealthStats] = useState<HealthStats | null>(null)
  const [loading, setLoading] = useState(false)
  const [autoRefresh, setAutoRefresh] = useState(false)

  const fetchHealthStats = async () => {
    setLoading(true)
    try {
      const response = await fetch('/api/generate-enhanced-content-optimized')
      const data = await response.json()
      setHealthStats(data)
    } catch (error) {
      console.error('Failed to fetch health stats:', error)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchHealthStats()
  }, [])

  useEffect(() => {
    let interval: NodeJS.Timeout
    if (autoRefresh) {
      interval = setInterval(fetchHealthStats, 5000) // Refresh every 5 seconds
    }
    return () => {
      if (interval) clearInterval(interval)
    }
  }, [autoRefresh])

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'healthy': return 'bg-green-500'
      case 'degraded': return 'bg-yellow-500'
      case 'unhealthy': return 'bg-red-500'
      default: return 'bg-gray-500'
    }
  }

  const formatLatency = (ms: number) => {
    if (ms < 100) return `${ms}ms`
    if (ms < 1000) return `${ms}ms`
    return `${(ms / 1000).toFixed(1)}s`
  }

  return (
    <div className={className}>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Performance Monitor</CardTitle>
              <CardDescription>
                Real-time system health and performance metrics
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={fetchHealthStats}
                disabled={loading}
              >
                {loading ? 'Refreshing...' : 'Refresh'}
              </Button>
              <Button
                variant={autoRefresh ? 'default' : 'outline'}
                size="sm"
                onClick={() => setAutoRefresh(!autoRefresh)}
              >
                {autoRefresh ? 'Stop Auto' : 'Auto Refresh'}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {healthStats ? (
            <>
              {/* Overall Status */}
              <div className="flex items-center gap-3">
                <div className={`w-3 h-3 rounded-full ${getStatusColor(healthStats.status)}`} />
                <span className="font-medium">System Status: </span>
                <Badge variant={healthStats.status === 'healthy' ? 'default' : 'destructive'}>
                  {healthStats.status.toUpperCase()}
                </Badge>
                <span className="text-sm text-muted-foreground ml-auto">
                  Last updated: {new Date(healthStats.timestamp).toLocaleTimeString()}
                </span>
              </div>

              <Separator />

              {/* Database Health */}
              <div className="space-y-3">
                <h4 className="font-semibold flex items-center gap-2">
                  <div className={`w-2 h-2 rounded-full ${getStatusColor(healthStats.database.status)}`} />
                  Database
                </h4>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Status:</span>
                    <p className="font-medium">{healthStats.database.status}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Latency:</span>
                    <p className="font-medium">{formatLatency(healthStats.database.latency)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Connections:</span>
                    <p className="font-medium">
                      {healthStats.database.connections.activeConnections}/
                      {healthStats.database.connections.maxConnections}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Pool Usage:</span>
                    <p className="font-medium">
                      {Math.round((healthStats.database.connections.activeConnections / 
                                  healthStats.database.connections.maxConnections) * 100)}%
                    </p>
                  </div>
                </div>
              </div>

              <Separator />

              {/* Cache Performance */}
              <div className="space-y-3">
                <h4 className="font-semibold">Cache Performance</h4>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Cache Size:</span>
                    <p className="font-medium">
                      {healthStats.cache.size}/{healthStats.cache.maxSize}
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Hit Ratio:</span>
                    <p className="font-medium">
                      {(healthStats.cache.hitRatio * 100).toFixed(1)}%
                    </p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Cache Usage:</span>
                    <p className="font-medium">
                      {Math.round((healthStats.cache.size / healthStats.cache.maxSize) * 100)}%
                    </p>
                  </div>
                </div>
                
                {/* Cache Hit Ratio Visual */}
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                    style={{ width: `${healthStats.cache.hitRatio * 100}%` }}
                  />
                </div>
              </div>

              <Separator />

              {/* Performance Metrics */}
              <div className="space-y-3">
                <h4 className="font-semibold">Performance</h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-muted-foreground">Response Time:</span>
                    <p className="font-medium">{formatLatency(healthStats.responseTime)}</p>
                  </div>
                  <div>
                    <span className="text-muted-foreground">Optimization Level:</span>
                    <p className="font-medium">
                      {healthStats.cache.hitRatio > 0.8 ? 'Excellent' :
                       healthStats.cache.hitRatio > 0.6 ? 'Good' :
                       healthStats.cache.hitRatio > 0.3 ? 'Fair' : 'Poor'}
                    </p>
                  </div>
                </div>
              </div>

              {/* Recommendations */}
              <div className="bg-blue-50 p-4 rounded-lg">
                <h5 className="font-semibold text-sm mb-2">💡 Optimization Tips</h5>
                <ul className="text-sm space-y-1 text-muted-foreground">
                  {healthStats.cache.hitRatio < 0.5 && (
                    <li>• Consider running cache warming script for better performance</li>
                  )}
                  {healthStats.database.latency > 500 && (
                    <li>• Database latency is high - check connection pool settings</li>
                  )}
                  {healthStats.database.connections.activeConnections / 
                   healthStats.database.connections.maxConnections > 0.8 && (
                    <li>• Connection pool usage is high - consider increasing pool size</li>
                  )}
                  {healthStats.cache.size / healthStats.cache.maxSize > 0.9 && (
                    <li>• Cache is nearly full - consider increasing cache size</li>
                  )}
                </ul>
              </div>
            </>
          ) : (
            <div className="text-center py-8">
              <p className="text-muted-foreground">Loading performance metrics...</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
