// Content Management API utilities for Arcade and Discovery content creation

interface BaseContentData {
  title: string
  topic_id: string
  grade_level: number
  difficulty?: 'EASY' | 'MEDIUM' | 'HARD'
  status?: 'draft' | 'published'
}

interface ArcadeContentData extends BaseContentData {
  category: 'ARCADE'
  subtype: 'QUIZ' | 'FLASHCARDS' | 'GAME'
  payload: any // Game-specific payload (questions, cards, etc.)
}

interface DiscoveryContentData extends BaseContentData {
  category: 'DISCOVERY'
  subtype: 'FACT' | 'INFO'
  payload: {
    preview_text: string
    full_text: string
    [key: string]: any
  }
}

type ContentData = ArcadeContentData | DiscoveryContentData

interface ApiResponse<T> {
  success?: boolean
  data?: T
  error?: string
  message?: string
}

// Get current user ID (you'll need to implement this based on your auth system)
async function getCurrentUserId(): Promise<string | null> {
  try {
    // This should integrate with your existing auth system
    // For now, return a placeholder - replace with actual implementation
    const response = await fetch('/api/profile')
    const data = await response.json()
    return data?.user?.id || null
  } catch (error) {
    console.error('Failed to get current user ID:', error)
    return null
  }
}

// Create new arcade content
export async function createArcadeContent(contentData: Omit<ArcadeContentData, 'category'>): Promise<ApiResponse<any>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: 'Authentication required' }
    }

    const response = await fetch('/api/admin/arcade', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...contentData,
        created_by: userId,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to create arcade content' }
    }

    return { success: true, data: result.data, message: 'Arcade content created successfully!' }
  } catch (error) {
    console.error('Create arcade content error:', error)
    return { error: 'Network error occurred while creating content' }
  }
}

// Create new discovery content
export async function createDiscoveryContent(contentData: Omit<DiscoveryContentData, 'category'>): Promise<ApiResponse<any>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: 'Authentication required' }
    }

    const response = await fetch('/api/admin/discovery', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        ...contentData,
        created_by: userId,
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to create discovery content' }
    }

    return { success: true, data: result.data, message: 'Discovery content created successfully!' }
  } catch (error) {
    console.error('Create discovery content error:', error)
    return { error: 'Network error occurred while creating content' }
  }
}

// Update arcade content
export async function updateArcadeContent(id: string, contentData: Partial<ArcadeContentData>): Promise<ApiResponse<any>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: 'Authentication required' }
    }

    const response = await fetch('/api/admin/arcade', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        ...contentData,
        userId, // For authorization
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to update arcade content' }
    }

    return { success: true, data: result.data, message: 'Arcade content updated successfully!' }
  } catch (error) {
    console.error('Update arcade content error:', error)
    return { error: 'Network error occurred while updating content' }
  }
}

// Update discovery content
export async function updateDiscoveryContent(id: string, contentData: Partial<DiscoveryContentData>): Promise<ApiResponse<any>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: 'Authentication required' }
    }

    const response = await fetch('/api/admin/discovery', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        id,
        ...contentData,
        userId, // For authorization
      }),
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to update discovery content' }
    }

    return { success: true, data: result.data, message: 'Discovery content updated successfully!' }
  } catch (error) {
    console.error('Update discovery content error:', error)
    return { error: 'Network error occurred while updating content' }
  }
}

// Get arcade content for admin
export async function getArcadeContent(filters: {
  subtype?: 'QUIZ' | 'FLASHCARDS' | 'GAME'
  status?: 'draft' | 'published' | 'all'
  gradeLevel?: number
  topicId?: string
  limit?: number
  offset?: number
  search?: string
} = {}): Promise<ApiResponse<any[]>> {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const response = await fetch(`/api/admin/arcade?${params}`)
    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to fetch arcade content' }
    }

    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Get arcade content error:', error)
    return { error: 'Network error occurred while fetching content' }
  }
}

// Get discovery content for admin
export async function getDiscoveryContent(filters: {
  subtype?: 'FACT' | 'INFO'
  status?: 'draft' | 'published' | 'all'
  gradeLevel?: number
  topicId?: string
  limit?: number
  offset?: number
  search?: string
} = {}): Promise<ApiResponse<any[]>> {
  try {
    const params = new URLSearchParams()
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.append(key, value.toString())
      }
    })

    const response = await fetch(`/api/admin/discovery?${params}`)
    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to fetch discovery content' }
    }

    return { success: true, data: result.data || [] }
  } catch (error) {
    console.error('Get discovery content error:', error)
    return { error: 'Network error occurred while fetching content' }
  }
}

// Delete arcade content
export async function deleteArcadeContent(id: string): Promise<ApiResponse<any>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: 'Authentication required' }
    }

    const response = await fetch(`/api/admin/arcade?id=${id}&userId=${userId}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to delete arcade content' }
    }

    return { success: true, message: result.message || 'Content deleted successfully!' }
  } catch (error) {
    console.error('Delete arcade content error:', error)
    return { error: 'Network error occurred while deleting content' }
  }
}

// Delete discovery content
export async function deleteDiscoveryContent(id: string): Promise<ApiResponse<any>> {
  try {
    const userId = await getCurrentUserId()
    if (!userId) {
      return { error: 'Authentication required' }
    }

    const response = await fetch(`/api/admin/discovery?id=${id}&userId=${userId}`, {
      method: 'DELETE',
    })

    const result = await response.json()

    if (!response.ok) {
      return { error: result.error || 'Failed to delete discovery content' }
    }

    return { success: true, message: result.message || 'Content deleted successfully!' }
  } catch (error) {
    console.error('Delete discovery content error:', error)
    return { error: 'Network error occurred while deleting content' }
  }
}

// Helper function to validate content before submission
export function validateContentData(contentData: Partial<ContentData>): string | null {
  if (!contentData.title?.trim()) {
    return 'Title is required'
  }
  
  if (!contentData.topic_id) {
    return 'Topic selection is required'
  }
  
  if (!contentData.grade_level || contentData.grade_level < 1 || contentData.grade_level > 6) {
    return 'Grade level must be between 1 and 6'
  }
  
  if (!contentData.payload) {
    return 'Content payload is required'
  }
  
  // Additional validation for discovery content
  if (contentData.category === 'DISCOVERY') {
    const payload = contentData.payload as any
    if (!payload.preview_text?.trim()) {
      return 'Preview text is required for discovery content'
    }
    if (!payload.full_text?.trim()) {
      return 'Full text content is required for discovery content'
    }
  }
  
  return null // No validation errors
}

export type {
  ArcadeContentData,
  DiscoveryContentData,
  ContentData,
  ApiResponse
}