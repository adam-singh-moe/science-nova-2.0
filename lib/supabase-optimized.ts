import { createClient } from "@supabase/supabase-js"
import { createServerClient as createSupabaseServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import type { Database } from "./supabase"

// Connection pool simulation for Supabase clients (testing phase optimization)
class SupabaseConnectionManager {
  private static instance: SupabaseConnectionManager
  private serverClients: Map<string, any> = new Map()
  private readonly maxConnections = 10
  private connectionCount = 0

  private constructor() {}

  static getInstance(): SupabaseConnectionManager {
    if (!SupabaseConnectionManager.instance) {
      SupabaseConnectionManager.instance = new SupabaseConnectionManager()
    }
    return SupabaseConnectionManager.instance
  }

  // Get or create a server client with connection reuse
  getServerClient(key = 'default'): any {
    if (this.serverClients.has(key)) {
      return this.serverClients.get(key)
    }

    if (this.connectionCount >= this.maxConnections) {
      // Return existing connection instead of creating new one
      return this.serverClients.values().next().value
    }

    const client = createClient<Database>(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          persistSession: false,
          autoRefreshToken: false,
        },
        db: {
          schema: 'public',
        },
        global: {
          headers: {
            'x-connection-pool': key,
          },
        },
      }
    )

    this.serverClients.set(key, client)
    this.connectionCount++
    return client
  }

  // Cleanup connections (useful for testing)
  cleanup(): void {
    this.serverClients.clear()
    this.connectionCount = 0
  }

  getStats() {
    return {
      activeConnections: this.connectionCount,
      maxConnections: this.maxConnections,
      clients: this.serverClients.size,
    }
  }
}

const connectionManager = SupabaseConnectionManager.getInstance()

// Optimized server client creation with connection pooling
export function createServerClient(key?: string) {
  return connectionManager.getServerClient(key)
}

// Optimized route handler client (no pooling needed, per-request)
export async function createRouteHandlerClient() {
  const cookieStore = await cookies()
  
  return createSupabaseServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll()
        },
        setAll(cookiesToSet: Array<{ name: string; value: string; options?: any }>) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            )
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

// Batch operations helper for improved performance
export class BatchOperationManager {
  private static instance: BatchOperationManager
  private pendingOperations: Map<string, any[]> = new Map()
  private batchTimeout: NodeJS.Timeout | null = null
  private readonly batchSize = 100
  private readonly batchDelay = 100 // ms

  private constructor() {}

  static getInstance(): BatchOperationManager {
    if (!BatchOperationManager.instance) {
      BatchOperationManager.instance = new BatchOperationManager()
    }
    return BatchOperationManager.instance
  }

  // Add operation to batch
  addOperation(table: string, operation: any): Promise<any> {
    if (!this.pendingOperations.has(table)) {
      this.pendingOperations.set(table, [])
    }

    const operations = this.pendingOperations.get(table)!
    operations.push(operation)

    // Schedule batch execution
    if (!this.batchTimeout) {
      this.batchTimeout = setTimeout(() => this.executeBatches(), this.batchDelay)
    }

    // Execute immediately if batch is full
    if (operations.length >= this.batchSize) {
      this.executeBatches()
    }

    return Promise.resolve(operation)
  }

  private async executeBatches(): Promise<void> {
    if (this.batchTimeout) {
      clearTimeout(this.batchTimeout)
      this.batchTimeout = null
    }

    const client = createServerClient('batch')

    for (const [table, operations] of this.pendingOperations.entries()) {
      if (operations.length === 0) continue

      try {
        // Execute batch operations
        if (operations[0].type === 'insert') {
          const data = operations.map(op => op.data)
          await client.from(table).insert(data)
        } else if (operations[0].type === 'update') {
          // Execute updates individually for now (can be optimized further)
          for (const op of operations) {
            await client.from(table).update(op.data).eq('id', op.id)
          }
        }
      } catch (error) {
        console.error(`Batch operation failed for table ${table}:`, error)
      }
    }

    // Clear pending operations
    this.pendingOperations.clear()
  }

  // Force execute all pending batches
  async flush(): Promise<void> {
    await this.executeBatches()
  }
}

export const batchManager = BatchOperationManager.getInstance()

// Performance monitoring for connections
export function getConnectionStats() {
  return connectionManager.getStats()
}

// Helper for parallel database operations
export async function parallelQuery<T>(
  queries: Array<() => Promise<T>>
): Promise<T[]> {
  const maxConcurrency = 5 // Limit concurrent queries
  const results: T[] = []
  
  for (let i = 0; i < queries.length; i += maxConcurrency) {
    const batch = queries.slice(i, i + maxConcurrency)
    const batchResults = await Promise.all(batch.map(query => query()))
    results.push(...batchResults)
  }
  
  return results
}

// Database health check
export async function checkDatabaseHealth(): Promise<{
  status: 'healthy' | 'degraded' | 'unhealthy'
  latency: number
  connections: any
}> {
  const start = Date.now()
  
  try {
    const client = createServerClient('health-check')
    await client.from('topics').select('count').limit(1).single()
    
    const latency = Date.now() - start
    const connections = getConnectionStats()
    
    return {
      status: latency < 100 ? 'healthy' : latency < 500 ? 'degraded' : 'unhealthy',
      latency,
      connections
    }
  } catch (error) {
    return {
      status: 'unhealthy',
      latency: Date.now() - start,
      connections: getConnectionStats()
    }
  }
}
