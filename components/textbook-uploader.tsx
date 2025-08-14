"use client"

import React, { useState, useRef, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Progress } from "@/components/ui/progress"
import { Checkbox } from "@/components/ui/checkbox"
import { Upload, File, X, Check, AlertCircle, Trash2, Eye, Play, Settings } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { theme } from "@/lib/theme"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"

interface TextbookUpload {
  id: string
  name: string
  file_name: string
  file_path: string
  file_size: number
  grade_level: number
  description: string | null
  processed: boolean
  processing_started_at: string | null
  processing_completed_at: string | null
  processing_error: string | null
  chunks_created: number
  created_at: string
  uploader?: {
    full_name: string
  }
}

interface TextbookUploaderProps {
  onUploadComplete?: () => void
}

export function TextbookUploader({ onUploadComplete }: TextbookUploaderProps) {
  const { toast } = useToast()
  const fileInputRef = useRef<HTMLInputElement>(null)
  
  const [uploading, setUploading] = useState(false)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [dragActive, setDragActive] = useState(false)
  const [uploads, setUploads] = useState<TextbookUpload[]>([])
  const [loading, setLoading] = useState(false)
  const [showUploads, setShowUploads] = useState(false)
  const [selectedTextbooks, setSelectedTextbooks] = useState<string[]>([])
  const [processingSelected, setProcessingSelected] = useState(false)
  const [formData, setFormData] = useState({
    name: "",
    gradeLevel: "",
    description: "",
  })

  const fetchUploads = async () => {
    setLoading(true)
    console.log('🔍 Starting fetchUploads...')
    
    try {
      const { data: { session } } = await supabase.auth.getSession()
      console.log('🔐 Auth session:', session ? 'Found' : 'Not found')
      
      if (!session) {
        console.error('❌ No session found')
        return
      }      console.log('📡 Making API request to /api/upload-textbook')
      
      // First try debug endpoint
      console.log('🔧 Testing debug endpoint...')
      const debugResponse = await fetch('/api/debug-textbook', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })
      const debugData = await debugResponse.json()
      console.log('🔧 Debug response:', debugResponse.status, debugData)
      
      const response = await fetch('/api/upload-textbook', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      console.log('📊 API response status:', response.status)
      
      if (response.ok) {
        const data = await response.json()
        console.log('✅ Fetched uploads data:', data)
        console.log('📚 Number of textbooks:', data.textbooks?.length || 0)
        setUploads(data.textbooks || [])      } else {
        console.log('⚠️ Non-OK response, status:', response.status)
        let error
        try {
          error = await response.json()
        } catch (e) {
          console.log('Failed to parse error response as JSON')
          error = { error: `HTTP ${response.status}: ${response.statusText}` }
        }
        console.error('❌ API error response:', error)
        toast({
          title: "Error fetching uploads",
          description: error.error || error.message || `HTTP ${response.status}`,
          variant: "destructive",
        })
      }
    } catch (error) {
      console.error('💥 Error fetching uploads:', error)
      toast({
        title: "Network error",
        description: "Failed to connect to server",
        variant: "destructive",
      })
    } finally {
      setLoading(false)
    }
  }

  // Fetch uploads when dialog opens
  useEffect(() => {
    if (showUploads) {
      fetchUploads()
    }
  }, [showUploads])

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true)
    } else if (e.type === "dragleave") {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0]
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file.",
          variant: "destructive",
        })
      }
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]
      if (file.type === 'application/pdf') {
        setSelectedFile(file)
      } else {
        toast({
          title: "Invalid file type",
          description: "Please select a PDF file.",
          variant: "destructive",
        })      }
    }
  }

  const handleUpload = async () => {
    if (!selectedFile || !formData.gradeLevel || !formData.name.trim()) {
      toast({
        title: "Missing information",
        description: "Please select a file, provide a name, and select grade level.",
        variant: "destructive",
      })
      return
    }

    setUploading(true)
    setUploadProgress(0)

    try {      const { data: { session } } = await supabase.auth.getSession()
      
      if (!session) {
        throw new Error('Not authenticated')
      }

      const uploadFormData = new FormData()
      uploadFormData.append('file', selectedFile)
      uploadFormData.append('name', formData.name)
      uploadFormData.append('gradeLevel', formData.gradeLevel)
      uploadFormData.append('description', formData.description)

      // Simulate progress (since we can't get real progress from fetch)
      const progressInterval = setInterval(() => {
        setUploadProgress((prev) => {
          if (prev >= 90) return prev
          return prev + Math.random() * 15
        })
      }, 200)

      const response = await fetch('/api/upload-textbook', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: uploadFormData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const result = await response.json()
        toast({
        title: "Upload successful!",
        description: `${selectedFile.name} has been uploaded successfully.`,
      })

      // Reset form
      setSelectedFile(null)
      setFormData({ name: "", gradeLevel: "", description: "" })
      if (fileInputRef.current) {
        fileInputRef.current.value = ""
      }

      if (onUploadComplete) {
        onUploadComplete()
      }

      // Refresh uploads list if showing
      if (showUploads) {
        fetchUploads()
      }

    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload textbook.",
        variant: "destructive",
      })
    } finally {
      setUploading(false)
      setUploadProgress(0)
    }
  }

  const handleDelete = async (textbook: TextbookUpload) => {
    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) return

      const response = await fetch(`/api/upload-textbook?path=${encodeURIComponent(textbook.file_path)}&id=${textbook.id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
        },
      })

      if (response.ok) {
        toast({
          title: "Deleted successfully",
          description: `${textbook.file_name} has been deleted.`,
        })
        fetchUploads()
      } else {
        throw new Error('Delete failed')
      }
    } catch (error) {
      toast({
        title: "Delete failed",
        description: "Failed to delete textbook.",
        variant: "destructive",
      })
    }
  }

  const handleSelectTextbook = (textbookId: string, selected: boolean) => {
    if (selected) {
      setSelectedTextbooks(prev => [...prev, textbookId])
    } else {
      setSelectedTextbooks(prev => prev.filter(id => id !== textbookId))
    }
  }

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedTextbooks(uploads.map(upload => upload.id))
    } else {
      setSelectedTextbooks([])
    }
  }

  const handleProcessSelected = async () => {
    if (selectedTextbooks.length === 0) {
      toast({
        title: "No textbooks selected",
        description: "Please select at least one textbook to process.",
        variant: "destructive",
      })
      return
    }

    setProcessingSelected(true)
    console.log('🔄 Processing selected textbooks:', selectedTextbooks)

    try {
      const { data: { session } } = await supabase.auth.getSession()
      if (!session) {
        throw new Error('Not authenticated')
      }

      const response = await fetch('/api/process-selected-textbooks', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ textbookIds: selectedTextbooks })
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Failed to start processing')
      }

      const result = await response.json()
      
      toast({
        title: "Processing Started",
        description: `Started processing ${selectedTextbooks.length} textbooks. This may take several minutes.`,
      })

      // Clear selection and refresh uploads
      setSelectedTextbooks([])
      fetchUploads()

    } catch (error) {
      console.error('❌ Error processing selected textbooks:', error)
      toast({
        title: "Processing Failed",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive",
      })
    } finally {
      setProcessingSelected(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i]
  }

  return (
    <div className="space-y-6">
      {/* Upload Form */}
      <Card className="bg-card/80 backdrop-blur-xl border-white/10 rounded-2xl shadow-lg">
        <CardHeader>
          <CardTitle className={`font-heading ${theme.text.primary} flex items-center gap-2`}>
            <Upload className="h-5 w-5" />
            Upload Textbook
          </CardTitle>
          <CardDescription className={theme.text.secondary}>
            Upload PDF textbooks to make them available for content generation
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* File Drop Zone */}
          <div
            className={`
              relative border-2 border-dashed rounded-lg p-8 text-center transition-all duration-300
              ${dragActive 
                ? 'border-accent shadow-2xl shadow-accent/30 bg-accent/5' 
                : 'border-gray-300 bg-gray-50/50'
              }
              ${selectedFile ? 'border-green-400 shadow-xl shadow-green-400/20 bg-green-50/30' : ''}
            `}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
          >
            {selectedFile ? (
              <div className="space-y-3">
                <div className="flex items-center justify-center gap-3">
                  <File className="h-8 w-8 text-green-500" />
                  <div className="text-left">
                    <p className={`font-medium ${theme.text.primary}`}>{selectedFile.name}</p>
                    <p className={`text-sm ${theme.text.secondary}`}>{formatFileSize(selectedFile.size)}</p>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedFile(null)}
                    className="rounded-full border-2 text-red-600 hover:bg-red-50"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <Upload className={`h-12 w-12 ${theme.icon.secondary} mx-auto`} />
                <div>
                  <p className={`text-lg font-medium ${theme.text.primary}`}>
                    Drop your PDF here or{" "}
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className={`${theme.text.accent} hover:underline`}
                    >
                      browse files
                    </button>
                  </p>
                  <p className={`text-sm ${theme.text.secondary} mt-1`}>
                    Maximum file size: 50MB • PDF files only
                  </p>
                </div>
              </div>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept=".pdf"
              onChange={handleFileSelect}
              className="hidden"
            />
          </div>

          {/* Form Fields */}          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name" className={theme.text.primary}>Textbook Name *</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                placeholder="e.g., Biology Grade 9 Textbook"
                className="bg-background/60 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="gradeLevel" className={theme.text.primary}>Grade Level *</Label>
              <Select value={formData.gradeLevel} onValueChange={(value) => setFormData({ ...formData, gradeLevel: value })}>
                <SelectTrigger className="bg-background/60 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20">
                  <SelectValue placeholder="Select grade" />
                </SelectTrigger>
                <SelectContent className="bg-card/90 backdrop-blur-xl border-white/20 rounded-lg shadow-lg">
                  {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map((grade) => (
                    <SelectItem
                      key={grade}
                      value={grade.toString()}
                      className="focus:bg-accent/10 focus:text-accent-foreground"
                    >
                      Grade {grade}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description" className={theme.text.primary}>Description (Optional)</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              className="bg-background/60 border-2 border-gray-300 rounded-lg focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
              placeholder="Brief description of the textbook content..."
              rows={3}
            />
          </div>

          {/* Upload Progress */}
          {uploading && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className={theme.text.primary}>Uploading...</span>
                <span className={theme.text.secondary}>{Math.round(uploadProgress)}%</span>
              </div>
              <Progress value={uploadProgress} className="w-full" />
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex gap-3">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || !formData.gradeLevel || !formData.name.trim() || uploading}
              className="flex-1 rounded-full"
            >
              {uploading ? "Uploading..." : "Upload Textbook"}
            </Button>

            <Dialog open={showUploads} onOpenChange={setShowUploads}>
              <DialogTrigger asChild>
                <Button
                  variant="outline"
                  onClick={fetchUploads}
                  className="rounded-full"
                >
                  <Eye className="h-4 w-4 mr-2" />
                  View Uploads
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-4xl max-h-[80vh] overflow-hidden bg-card/90 backdrop-blur-xl border-white/20 rounded-2xl shadow-lg">
                <DialogHeader>
                  <DialogTitle className="font-heading text-xl text-blue-700">Uploaded Textbooks</DialogTitle>
                  <DialogDescription className="text-green-700">
                    Manage your uploaded textbook files and process them for AI content generation
                  </DialogDescription>
                </DialogHeader>
                
                {/* Processing Controls */}
                {uploads.length > 0 && (
                  <div className="p-4 rounded-lg bg-accent/5 border border-accent/20 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <Checkbox
                          id="select-all"
                          checked={selectedTextbooks.length === uploads.length && uploads.length > 0}
                          onCheckedChange={handleSelectAll}
                        />
                        <Label htmlFor="select-all" className={theme.text.primary}>
                          Select All ({selectedTextbooks.length}/{uploads.length} selected)
                        </Label>
                      </div>
                      
                      <Button
                        onClick={handleProcessSelected}
                        disabled={selectedTextbooks.length === 0 || processingSelected}
                        className="rounded-full flex items-center gap-2"
                      >
                        {processingSelected ? (
                          <>
                            <Settings className="h-4 w-4 animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <Play className="h-4 w-4" />
                            Process Selected ({selectedTextbooks.length})
                          </>
                        )}
                      </Button>
                    </div>
                    
                    {selectedTextbooks.length > 0 && (
                      <div className={`text-sm ${theme.text.secondary}`}>
                        Selected textbooks will be processed into chunks for AI content generation.
                        This process may take several minutes per textbook.
                      </div>
                    )}
                  </div>
                )}
                
                <div className="overflow-y-auto max-h-[60vh]">
                  {loading ? (
                    <div className="text-center py-8">
                      <div className={`text-lg ${theme.text.secondary}`}>Loading uploads...</div>
                    </div>
                  ) : uploads.length > 0 ? (
                    <div className="space-y-3">                      {uploads.map((upload) => (
                        <div
                          key={upload.id}
                          className={`flex items-start gap-3 p-4 rounded-lg ${theme.background.secondary} ${theme.border.primary} border ${
                            selectedTextbooks.includes(upload.id) ? 'ring-2 ring-blue-500' : ''
                          }`}
                        >
                          {/* Selection Checkbox */}
                          <Checkbox
                            id={`textbook-${upload.id}`}
                            checked={selectedTextbooks.includes(upload.id)}
                            onCheckedChange={(checked) => handleSelectTextbook(upload.id, !!checked)}
                            className="mt-1"
                          />
                          
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h4 className={`font-medium ${theme.text.primary}`}>{upload.name || upload.file_name}</h4>
                              <Badge variant="secondary">Grade {upload.grade_level}</Badge>
                              {upload.processed && (
                                <Badge className="bg-green-500/60">
                                  <Check className="h-3 w-3 mr-1" />
                                  Processed ({upload.chunks_created} chunks)
                                </Badge>
                              )}
                              {!upload.processed && upload.processing_started_at && (
                                <Badge className="bg-yellow-500/60">
                                  <Settings className="h-3 w-3 mr-1 animate-spin" />
                                  Processing...
                                </Badge>
                              )}
                              {upload.processing_error && (
                                <Badge variant="destructive">
                                  <AlertCircle className="h-3 w-3 mr-1" />
                                  Error
                                </Badge>
                              )}
                            </div><div className={`text-sm ${theme.text.secondary} space-y-1`}>
                              <p>File: {upload.file_name}</p>
                              <p>Size: {formatFileSize(upload.file_size)}</p>
                              {upload.description && <p>Description: {upload.description}</p>}
                              <p>Uploaded: {new Date(upload.created_at).toLocaleDateString()}</p>
                              {upload.uploader && (
                                <p>By: {upload.uploader.full_name}</p>
                              )}
                            </div>
                          </div>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDelete(upload)}
                            className="rounded-full border-2 text-red-600 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Upload className={`h-16 w-16 ${theme.icon.warning} mx-auto mb-4`} />
                      <h3 className={`text-xl font-semibold ${theme.text.primary} mb-2`}>No uploads yet</h3>
                      <p className={theme.text.secondary}>Upload your first textbook to get started!</p>
                    </div>
                  )}
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
