"use client"

import { useState, useEffect } from 'react'
import { Card } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { 
  Database, 
  Upload, 
  Search, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Loader2,
  RefreshCw,
  Download,
  Trash2,
  Eye
} from 'lucide-react'
import { useAuth } from '@/contexts/auth-context'
import { supabase } from '@/lib/supabase'

interface EmbeddingEntry {
  id: string
  grade_level: number
  file_name: string
  chunk_index: number
  content: string
  metadata: any
  created_at: string
}

interface SearchResult {
  id: string
  content: string
  metadata: any
  similarity: number
}

export default function EmbeddingsPage() {
  const { session } = useAuth()
  
  // Upload State
  const [uploadContent, setUploadContent] = useState('')
  const [uploadFileName, setUploadFileName] = useState('')
  const [uploadGradeLevel, setUploadGradeLevel] = useState(4)
  const [uploadMetadata, setUploadMetadata] = useState('')
  const [uploading, setUploading] = useState(false)
  const [uploadResult, setUploadResult] = useState<string | null>(null)
  
  // Search State
  const [searchQuery, setSearchQuery] = useState('')
  const [searchGradeLevel, setSearchGradeLevel] = useState<number | null>(null)
  const [searchThreshold, setSearchThreshold] = useState(0.7)
  const [searchResults, setSearchResults] = useState<SearchResult[]>([])
  const [searching, setSearching] = useState(false)
  
  // Management State
  const [embeddings, setEmbeddings] = useState<EmbeddingEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [selectedFile, setSelectedFile] = useState<string | null>(null)
  const [stats, setStats] = useState<{
    totalEmbeddings: number
    uniqueFiles: number
    gradeDistribution: Record<number, number>
  } | null>(null)

  // Fetch embeddings statistics and data
  const fetchEmbeddings = async () => {
    setLoading(true)
    try {
      // Get all embeddings
      const { data: embeddingsData, error: embeddingsError } = await supabase
        .from('textbook_embeddings')
        .select('*')
        .order('grade_level', { ascending: true })
        .order('file_name', { ascending: true })
        .order('chunk_index', { ascending: true })
        .limit(100)

      if (embeddingsError) {
        console.error('Error fetching embeddings:', embeddingsError)
        return
      }

      setEmbeddings(embeddingsData || [])

      // Calculate statistics
      if (embeddingsData) {
        const uniqueFiles = new Set(embeddingsData.map(e => e.file_name)).size
        const gradeDistribution = embeddingsData.reduce((acc, e) => {
          acc[e.grade_level] = (acc[e.grade_level] || 0) + 1
          return acc
        }, {} as Record<number, number>)

        setStats({
          totalEmbeddings: embeddingsData.length,
          uniqueFiles,
          gradeDistribution
        })
      }
    } catch (error) {
      console.error('Error fetching embeddings:', error)
    } finally {
      setLoading(false)
    }
  }

  // Upload content for embedding processing
  const handleUpload = async () => {
    if (!uploadContent.trim() || !uploadFileName.trim()) {
      setUploadResult('Content and file name are required')
      return
    }

    setUploading(true)
    setUploadResult(null)

    try {
      let metadata = {}
      if (uploadMetadata.trim()) {
        try {
          metadata = JSON.parse(uploadMetadata)
        } catch (e) {
          setUploadResult('Invalid JSON in metadata field')
          setUploading(false)
          return
        }
      }

      const response = await fetch('/api/embeddings', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          content: uploadContent,
          gradeLevel: uploadGradeLevel,
          fileName: uploadFileName,
          metadata,
          overwrite: true
        })
      })

      const result = await response.json()

      if (!response.ok) {
        setUploadResult(`Error: ${result.error}`)
        return
      }

      setUploadResult(`Success: ${result.chunksProcessed} chunks processed, ${result.embeddingsStored} embeddings stored`)
      
      // Clear form
      setUploadContent('')
      setUploadFileName('')
      setUploadMetadata('')
      
      // Refresh embeddings list
      fetchEmbeddings()

    } catch (error) {
      console.error('Upload error:', error)
      setUploadResult(`Error: ${error}`)
    } finally {
      setUploading(false)
    }
  }

  // Search using embeddings
  const handleSearch = async () => {
    if (!searchQuery.trim()) return

    setSearching(true)
    try {
      const params = new URLSearchParams({
        q: searchQuery,
        threshold: searchThreshold.toString(),
        limit: '10'
      })

      if (searchGradeLevel) {
        params.append('grade', searchGradeLevel.toString())
      }

      const response = await fetch(`/api/embeddings?${params}`)
      const result = await response.json()

      if (!response.ok) {
        console.error('Search error:', result.error)
        return
      }

      setSearchResults(result.results || [])
    } catch (error) {
      console.error('Search error:', error)
    } finally {
      setSearching(false)
    }
  }

  // Delete embeddings for a specific file
  const handleDeleteFile = async (fileName: string, gradeLevel: number) => {
    if (!confirm(`Delete all embeddings for "${fileName}" (Grade ${gradeLevel})?`)) {
      return
    }

    try {
      const { error } = await supabase
        .from('textbook_embeddings')
        .delete()
        .eq('file_name', fileName)
        .eq('grade_level', gradeLevel)

      if (error) {
        console.error('Delete error:', error)
        return
      }

      fetchEmbeddings()
    } catch (error) {
      console.error('Delete error:', error)
    }
  }

  useEffect(() => {
    if (session) {
      fetchEmbeddings()
    }
  }, [session])

  const getUniqueFiles = () => {
    const fileMap = new Map<string, { gradeLevel: number, chunks: number }>()
    
    embeddings.forEach(e => {
      const key = `${e.file_name}-${e.grade_level}`
      if (!fileMap.has(key)) {
        fileMap.set(key, { gradeLevel: e.grade_level, chunks: 0 })
      }
      fileMap.get(key)!.chunks++
    })

    return Array.from(fileMap.entries()).map(([fileName, data]) => ({
      fileName: fileName.split('-').slice(0, -1).join('-'),
      gradeLevel: data.gradeLevel,
      chunks: data.chunks,
      fullKey: fileName
    }))
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl">
      {/* Header */}
      <div className="flex items-center gap-3 mb-8">
        <div className="rounded-full bg-gradient-to-r from-blue-500 to-purple-500 p-3">
          <Database className="h-8 w-8 text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Embeddings Management</h1>
          <p className="text-gray-600">Upload content and manage AI-powered semantic search</p>
        </div>
      </div>

      {/* Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <FileText className="h-8 w-8 text-blue-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.totalEmbeddings}</p>
                <p className="text-sm text-gray-600">Total Embeddings</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Database className="h-8 w-8 text-green-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{stats.uniqueFiles}</p>
                <p className="text-sm text-gray-600">Unique Files</p>
              </div>
            </div>
          </Card>
          
          <Card className="p-4">
            <div className="flex items-center gap-3">
              <Search className="h-8 w-8 text-purple-500" />
              <div>
                <p className="text-2xl font-bold text-gray-800">{searchResults.length}</p>
                <p className="text-sm text-gray-600">Recent Results</p>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-center gap-3">
              <RefreshCw className="h-8 w-8 text-orange-500" />
              <div>
                <Button onClick={fetchEmbeddings} variant="outline" size="sm">
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Refresh
                </Button>
              </div>
            </div>
          </Card>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Upload Content */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Upload className="h-5 w-5 text-blue-500" />
            <h2 className="text-xl font-semibold">Upload Content</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="fileName">File Name</Label>
              <Input
                id="fileName"
                value={uploadFileName}
                onChange={(e) => setUploadFileName(e.target.value)}
                placeholder="e.g. chapter-1-photosynthesis"
              />
            </div>

            <div>
              <Label htmlFor="gradeLevel">Grade Level</Label>
              <select
                id="gradeLevel"
                value={uploadGradeLevel}
                onChange={(e) => setUploadGradeLevel(parseInt(e.target.value))}
                className="w-full px-3 py-2 border border-gray-300 rounded-md"
              >
                {[3, 4, 5, 6, 7, 8].map(grade => (
                  <option key={grade} value={grade}>Grade {grade}</option>
                ))}
              </select>
            </div>

            <div>
              <Label htmlFor="content">Content</Label>
              <textarea
                id="content"
                value={uploadContent}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUploadContent(e.target.value)}
                placeholder="Paste your textbook content here..."
                className="w-full min-h-[200px] px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <div>
              <Label htmlFor="metadata">Metadata (JSON, optional)</Label>
              <textarea
                id="metadata"
                value={uploadMetadata}
                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setUploadMetadata(e.target.value)}
                placeholder='{"subject": "Biology", "topic": "Photosynthesis", "chapter": 1}'
                className="w-full h-20 px-3 py-2 border border-gray-300 rounded-md"
              />
            </div>

            <Button 
              onClick={handleUpload}
              disabled={uploading || !uploadContent.trim() || !uploadFileName.trim()}
              className="w-full"
            >
              {uploading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <Upload className="h-4 w-4 mr-2" />
                  Upload & Process
                </>
              )}
            </Button>

            {uploadResult && (
              <div className={`p-3 rounded-md ${
                uploadResult.startsWith('Success') 
                  ? 'bg-green-50 text-green-800 border border-green-200'
                  : 'bg-red-50 text-red-800 border border-red-200'
              }`}>
                <div className="flex items-start gap-2">
                  {uploadResult.startsWith('Success') ? (
                    <CheckCircle className="h-5 w-5 mt-0.5" />
                  ) : (
                    <AlertCircle className="h-5 w-5 mt-0.5" />
                  )}
                  <p className="text-sm">{uploadResult}</p>
                </div>
              </div>
            )}
          </div>
        </Card>

        {/* Search */}
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <Search className="h-5 w-5 text-green-500" />
            <h2 className="text-xl font-semibold">Semantic Search</h2>
          </div>

          <div className="space-y-4">
            <div>
              <Label htmlFor="searchQuery">Search Query</Label>
              <Input
                id="searchQuery"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="e.g. How does photosynthesis work?"
                onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="searchGrade">Grade Level (optional)</Label>
                <select
                  id="searchGrade"
                  value={searchGradeLevel || ''}
                  onChange={(e) => setSearchGradeLevel(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md"
                >
                  <option value="">All Grades</option>
                  {[3, 4, 5, 6, 7, 8].map(grade => (
                    <option key={grade} value={grade}>Grade {grade}</option>
                  ))}
                </select>
              </div>

              <div>
                <Label htmlFor="threshold">Similarity Threshold</Label>
                <Input
                  id="threshold"
                  type="number"
                  min="0"
                  max="1"
                  step="0.1"
                  value={searchThreshold}
                  onChange={(e) => setSearchThreshold(parseFloat(e.target.value))}
                />
              </div>
            </div>

            <Button 
              onClick={handleSearch}
              disabled={searching || !searchQuery.trim()}
              className="w-full"
            >
              {searching ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Searching...
                </>
              ) : (
                <>
                  <Search className="h-4 w-4 mr-2" />
                  Search
                </>
              )}
            </Button>

            {/* Search Results */}
            {searchResults.length > 0 && (
              <div className="max-h-[400px] overflow-y-auto space-y-3">
                <h3 className="font-medium text-gray-800">Results ({searchResults.length})</h3>
                {searchResults.map((result, index) => (
                  <div key={result.id} className="p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <Badge variant="outline">
                        Similarity: {(result.similarity * 100).toFixed(1)}%
                      </Badge>
                      {result.metadata?.grade_level && (
                        <Badge variant="secondary">
                          Grade {result.metadata.grade_level}
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-gray-700 line-clamp-3">
                      {result.content}
                    </p>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>
      </div>

      {/* File Management */}
      <Card className="p-6 mt-8">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-purple-500" />
            <h2 className="text-xl font-semibold">Embedded Files</h2>
          </div>
          <Button onClick={fetchEmbeddings} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 className="h-6 w-6 animate-spin" />
            <span className="ml-2">Loading embeddings...</span>
          </div>
        ) : (
          <div className="space-y-3">
            {getUniqueFiles().map((file, index) => (
              <div key={file.fullKey} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-5 w-5 text-blue-500" />
                  <div>
                    <p className="font-medium">{file.fileName}</p>
                    <p className="text-sm text-gray-600">
                      Grade {file.gradeLevel} • {file.chunks} chunks
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(selectedFile === file.fullKey ? null : file.fullKey)}
                  >
                    <Eye className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleDeleteFile(file.fileName, file.gradeLevel)}
                    className="text-red-600 hover:text-red-800"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}

            {embeddings.length === 0 && !loading && (
              <div className="text-center py-8 text-gray-500">
                No embeddings found. Upload some content to get started.
              </div>
            )}
          </div>
        )}
      </Card>
    </div>
  )
}
