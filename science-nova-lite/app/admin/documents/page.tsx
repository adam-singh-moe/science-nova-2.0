"use client";

import { useState, useEffect } from "react";
import { RoleGuard } from "@/components/layout/role-guard";
import { useAuth } from "@/contexts/auth-context";
import Link from "next/link";
import { ChevronDown, Upload, Eye, Trash2, FileText, BookOpen, Database, Settings, AlertCircle, Clock, Zap, CheckCircle, BarChart3, Plus, Book, Loader2 } from 'lucide-react';
import { PDFViewer } from "@/components/admin/pdf-viewer";

interface Document {
  name: string;
  type: "curriculum" | "textbook";
  url: string;
  publicUrl?: string;
  signedUrl?: string;
  grade: number;
  path?: string;
  bucket?: string;
  id?: string; // For processing tracking
  processed?: boolean;
  chunks?: number;
  processingError?: string;
}

export default function DocumentsPage() {
  const { session } = useAuth();
  const [documents, setDocuments] = useState<Document[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedGrade, setSelectedGrade] = useState<number | null>(null);
  const [viewingDocument, setViewingDocument] = useState<Document | null>(null);
  const [sortBy, setSortBy] = useState<"grade" | "name" | "type">("grade");
  const [filterType, setFilterType] = useState<"all" | "curriculum" | "textbook">("all");
  const [showUpload, setShowUpload] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragActive, setDragActive] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);
  const [selectedFileName, setSelectedFileName] = useState<string | null>(null);
  
  // Processing state
  const [processing, setProcessing] = useState(false);
  const [selectedForProcessing, setSelectedForProcessing] = useState<string[]>([]);
  const [processingProgress, setProcessingProgress] = useState<{[key: string]: { status: 'processing' | 'completed' | 'error', progress: number, message?: string }}>({});
  const [documentProcessingStatus, setDocumentProcessingStatus] = useState<{[key: string]: { processed: boolean, chunks?: number, error?: string }}>({});

  // Check processing status for documents
  async function checkProcessingStatus() {
    if (!session) return;
    
    try {
      console.log("🔍 DEBUGGING: Calling /api/embeddings/status endpoint");
      const response = await fetch("/api/embeddings/status", {
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });
      
      console.log("🔍 DEBUGGING: Response status:", response.status);
      
      if (response.ok) {
        const data = await response.json();
        console.log("🔍 DEBUGGING: Raw response data:", JSON.stringify(data, null, 2));
        
        // Convert the new format to the expected format
        const statusByDocumentName: {[key: string]: { processed: boolean, chunks?: number, error?: string }} = {};
        
        if (data.documents && Array.isArray(data.documents)) {
          console.log("🔍 DEBUGGING: Processing", data.documents.length, "documents");
          data.documents.forEach((doc: any) => {
            statusByDocumentName[doc.name] = {
              processed: doc.processed,
              chunks: doc.chunkCount,
              error: doc.error
            };
            console.log(`🔍 DEBUGGING: ${doc.name} -> processed: ${doc.processed}, chunks: ${doc.chunkCount}`);
          });
        }
        
        console.log("🔍 DEBUGGING: Final status object:", JSON.stringify(statusByDocumentName, null, 2));
        setDocumentProcessingStatus(statusByDocumentName);
      } else {
        console.error("🔍 DEBUGGING: Failed response:", response.status, response.statusText);
      }
    } catch (err) {
      console.error("🔍 DEBUGGING: Error checking processing status:", err);
    }
  }

  useEffect(() => {
    async function fetchDocuments() {
      if (!session) return;
      
      try {
        setLoading(true);
        setError(null);

        // Use the API to fetch documents
        const response = await fetch("/api/documents", {
          headers: {
            Authorization: `Bearer ${session.access_token}`
          }
        });

        if (!response.ok) {
          throw new Error(`Failed to fetch documents: ${response.status}`);
        }

        const data = await response.json();
        setDocuments(data.documents || []);
        
        // Also check processing status
        await checkProcessingStatus();
      } catch (err) {
        console.error("Error fetching documents:", err);
        setError("Failed to load documents. Please try again later.");
      } finally {
        setLoading(false);
      }
    }

    fetchDocuments();
  }, [session]);

  // Upload document function
  async function handleUpload(formData: FormData) {
    if (!session) return;
    
    try {
      setUploading(true);
      setUploadProgress(0);
      setError(null);
      setUploadSuccess(null);
      
      // Simulate progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 90) {
            clearInterval(progressInterval);
            return prev;
          }
          return prev + 10;
        });
      }, 100);
      
      const response = await fetch("/api/documents/upload", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        },
        body: formData
      });

      clearInterval(progressInterval);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || `Upload failed: ${response.status}`);
      }

      const result = await response.json();
      setUploadProgress(100);
      
      // Refresh documents list
      const newDoc = result.data;
      setDocuments(prev => [...prev, newDoc]);
      
      setUploadSuccess(`Successfully uploaded "${newDoc.name}"`);
      
      // Auto-close after success
      setTimeout(() => {
        setShowUpload(false);
        setUploadSuccess(null);
        setUploadProgress(0);
        setSelectedFileName(null);
      }, 2000);
      
    } catch (err) {
      console.error("Error uploading document:", err);
      setError(err instanceof Error ? err.message : "Failed to upload document");
      setUploadProgress(0);
    } finally {
      setUploading(false);
    }
  }

  // Handle drag and drop
  function handleDrag(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setDragActive(true);
    } else if (e.type === "dragleave") {
      setDragActive(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    e.stopPropagation();
    setDragActive(false);
    
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      const file = e.dataTransfer.files[0];
      if (file.type === "application/pdf") {
        setSelectedFileName(file.name);
        setShowUpload(true);
      } else {
        setError("Only PDF files are allowed");
      }
    }
  }

  // Process selected documents
  async function handleProcessSelected() {
    if (selectedForProcessing.length === 0 || !session) return;
    
    setProcessing(true);
    setError(null);
    
    try {
      // Initialize progress for selected documents
      const initialProgress: {[key: string]: any} = {};
      selectedForProcessing.forEach(docId => {
        initialProgress[docId] = { status: 'processing', progress: 0, message: 'Starting processing...' };
      });
      setProcessingProgress(initialProgress);
      
      const response = await fetch("/api/embeddings/process", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ 
          documents: selectedForProcessing.map(docId => {
            const doc = documents.find(d => (d.id || d.path) === docId);
            return {
              id: docId,
              name: doc?.name,
              path: doc?.path,
              bucket: doc?.bucket,
              type: doc?.type,
              grade: doc?.grade
            };
          })
        })
      });

      if (!response.ok) {
        throw new Error(`Processing failed: ${response.status}`);
      }

      const result = await response.json();
      
      // Update progress based on actual results
      const finalProgress: {[key: string]: any} = {};
      
      if (result.results && Array.isArray(result.results)) {
        result.results.forEach((docResult: any) => {
          const docId = docResult.id;
          if (docResult.success) {
            finalProgress[docId] = { 
              status: 'completed', 
              progress: 100, 
              message: `Successfully processed! Created ${docResult.chunksProcessed || 0} AI chunks.` 
            };
          } else {
            finalProgress[docId] = { 
              status: 'error', 
              progress: 0, 
              message: docResult.error || 'Processing failed. Please try again.' 
            };
          }
        });
      } else {
        // Fallback if results format is unexpected
        selectedForProcessing.forEach(docId => {
          finalProgress[docId] = { 
            status: 'error', 
            progress: 0, 
            message: 'Unexpected response format. Please try again.' 
          };
        });
      }
      
      setProcessingProgress(finalProgress);
      
      // Clear selection and refresh
      setSelectedForProcessing([]);
      await checkProcessingStatus();
      
      // Clear progress after a delay - longer for errors, shorter for success
      const hasErrors = Object.values(finalProgress).some((progress: any) => progress.status === 'error');
      const delay = hasErrors ? 30000 : 10000; // 30 seconds for errors, 10 seconds for success
      
      setTimeout(() => {
        setProcessingProgress({});
      }, delay);
      
    } catch (err) {
      console.error("Error processing documents:", err);
      setError(err instanceof Error ? err.message : "Failed to process documents");
      
      // Update progress to error
      const errorProgress: {[key: string]: any} = {};
      selectedForProcessing.forEach(docId => {
        errorProgress[docId] = { 
          status: 'error', 
          progress: 0, 
          message: 'Processing failed. Please try again.' 
        };
      });
      setProcessingProgress(errorProgress);
    } finally {
      setProcessing(false);
    }
  }

  // Toggle document selection for processing
  function toggleDocumentSelection(docId: string) {
    setSelectedForProcessing(prev => 
      prev.includes(docId) 
        ? prev.filter(id => id !== docId)
        : [...prev, docId]
    );
  }

  // Check if document is processed
  function isDocumentProcessed(doc: Document): boolean {
    return documentProcessingStatus[doc.name]?.processed || false;
  }

  // Get processing info for document
  function getProcessingInfo(doc: Document) {
    return documentProcessingStatus[doc.name] || { processed: false };
  }

  // Delete document function
  async function handleDelete(doc: Document) {
    if (!session || !doc.bucket || !doc.path) return;
    
    if (!confirm(`Are you sure you want to delete "${doc.name}"?`)) return;
    
    try {
      const response = await fetch(`/api/documents/upload?bucket=${encodeURIComponent(doc.bucket)}&path=${encodeURIComponent(doc.path)}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${session.access_token}`
        }
      });

      if (!response.ok) {
        throw new Error(`Delete failed: ${response.status}`);
      }

      // Remove from local state
      setDocuments(prev => prev.filter(d => d.path !== doc.path || d.bucket !== doc.bucket));
      
    } catch (err) {
      console.error("Error deleting document:", err);
      setError(err instanceof Error ? err.message : "Failed to delete document");
    }
  }

  // Get unique grades
  const grades = Array.from(new Set(documents.map(doc => doc.grade))).sort((a, b) => a - b);

  // Filter documents by grade and type
  const filteredDocuments = documents
    .filter(doc => selectedGrade === null || doc.grade === selectedGrade)
    .filter(doc => filterType === "all" || doc.type === filterType)
    .sort((a, b) => {
      if (sortBy === "grade") {
        return a.grade - b.grade || a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
      } else if (sortBy === "type") {
        return a.type.localeCompare(b.type) || a.grade - b.grade || a.name.localeCompare(b.name);
      } else {
        return a.name.localeCompare(b.name);
      }
    });

  return (
    <div className="min-h-screen bg-gradient-to-br from-sky-50 via-violet-50 to-fuchsia-50">
      <RoleGuard allowed={["TEACHER", "ADMIN", "DEVELOPER"]}>
        <main className="mx-auto max-w-7xl px-4 py-6 md:px-6">
          {/* Admin navigation */}
          <div className="sticky top-0 z-10 mb-6 rounded-2xl border bg-white/70 px-3 py-3 backdrop-blur supports-[backdrop-filter]:bg-white/60 shadow-lg">
            <div className="flex flex-wrap items-center gap-2 md:gap-3">
              <Link
                href="/admin"
                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-gray-50"
              >
                <BarChart3 className="h-4 w-4" /> Dashboard
              </Link>
              <Link
                href="/admin/documents"
                className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500/10 to-sky-500/10 px-3 py-2 text-sm font-medium text-indigo-700 ring-1 ring-inset ring-indigo-200 hover:from-indigo-500/15 hover:to-sky-500/15"
              >
                <FileText className="h-4 w-4" /> Textbooks & Curriculum
              </Link>
            </div>
          </div>
          
          {/* Header */}
          <div className="mb-8 rounded-3xl border bg-gradient-to-r from-indigo-100 via-sky-100 to-fuchsia-100 p-8 shadow-lg">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-center lg:justify-between">
              <div className="flex-1">
                <h1 className="text-3xl font-bold text-indigo-900 md:text-4xl">Textbooks & Curriculum</h1>
                <p className="mt-2 max-w-3xl text-base text-indigo-900/70 md:text-lg">
                  Manage and access educational content organized by grade level. Upload new documents or browse existing materials.
                </p>
                
                {/* Quick Stats */}
                <div className="mt-6 grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-indigo-900">{documents.length}</div>
                    <div className="text-sm text-indigo-700">Total Documents</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-blue-900">{documents.filter(d => d.type === "textbook").length}</div>
                    <div className="text-sm text-blue-700">Textbooks</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-green-900">{documents.filter(d => d.type === "curriculum").length}</div>
                    <div className="text-sm text-green-700">Curriculum Guides</div>
                  </div>
                  <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                    <div className="text-2xl font-bold text-purple-900">{grades.length}</div>
                    <div className="text-sm text-purple-700">Grade Levels</div>
                  </div>
                </div>
              </div>
              
              <div className="flex flex-col gap-3 sm:flex-row lg:flex-col xl:flex-row">
                <button
                  onClick={() => {
                    setShowUpload(true);
                    setSelectedFileName(null);
                    setError(null);
                    setUploadSuccess(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-tr from-indigo-500 to-purple-500 px-6 py-4 text-white shadow-lg hover:brightness-105 transition-all hover:shadow-xl font-medium"
                >
                  <Plus className="h-5 w-5" /> Upload Document
                </button>
                <button
                  onClick={() => setFilterType(filterType === "textbook" ? "all" : "textbook")}
                  className={`inline-flex items-center gap-2 rounded-2xl px-6 py-4 shadow-lg hover:brightness-105 transition-all hover:shadow-xl font-medium ${
                    filterType === "textbook" 
                      ? "bg-gradient-to-tr from-blue-500 to-sky-500 text-white" 
                      : "bg-white/80 text-blue-700 border border-blue-200"
                  }`}
                >
                  <Book className="h-5 w-5" /> 
                  {filterType === "textbook" ? "Show All" : "Textbooks Only"}
                </button>
                <button
                  onClick={() => setFilterType(filterType === "curriculum" ? "all" : "curriculum")}
                  className={`inline-flex items-center gap-2 rounded-2xl px-6 py-4 shadow-lg hover:brightness-105 transition-all hover:shadow-xl font-medium ${
                    filterType === "curriculum" 
                      ? "bg-gradient-to-tr from-green-500 to-teal-500 text-white" 
                      : "bg-white/80 text-green-700 border border-green-200"
                  }`}
                >
                  <FileText className="h-5 w-5" /> 
                  {filterType === "curriculum" ? "Show All" : "Curriculum Only"}
                </button>
              </div>
            </div>
          </div>
          
          {/* Filters and sort options */}
          <div className="mb-6 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-indigo-100 text-indigo-600">
                  <FileText className="h-5 w-5" />
                </div>
                <h2 className="text-lg font-medium text-gray-900">Document Library</h2>
              </div>
              
              <div className="flex items-center gap-3 bg-white/80 backdrop-blur p-2 rounded-xl shadow-sm">
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-700">Sort:</span>
                  <div className="rounded-lg border border-gray-200 bg-white">
                    <select 
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value as any)}
                      className="rounded-lg border-none bg-transparent px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="grade">Grade</option>
                      <option value="name">Name</option>
                      <option value="type">Type</option>
                    </select>
                  </div>
                </div>
                
                <div className="h-4 w-px bg-gray-200"></div>
                
                <div className="flex items-center gap-1.5">
                  <span className="text-sm font-medium text-gray-700">Type:</span>
                  <div className="rounded-lg border border-gray-200 bg-white">
                    <select 
                      value={filterType}
                      onChange={(e) => setFilterType(e.target.value as any)}
                      className="rounded-lg border-none bg-transparent px-3 py-1.5 text-sm text-gray-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    >
                      <option value="all">All Types</option>
                      <option value="curriculum">Curriculum</option>
                      <option value="textbook">Textbook</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Grade filter */}
            <div className="rounded-2xl border bg-white/80 p-3 backdrop-blur shadow-lg">
              <div className="flex flex-wrap items-center gap-2">
                <button 
                  onClick={() => setSelectedGrade(null)} 
                  className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${selectedGrade === null 
                    ? "bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-md" 
                    : "bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-200"}`}
                >
                  All Grades
                </button>
                {grades.map(grade => (
                  <button 
                    key={grade} 
                    onClick={() => setSelectedGrade(grade)}
                    className={`rounded-xl px-4 py-2 text-sm font-medium transition-all ${selectedGrade === grade 
                      ? "bg-gradient-to-r from-indigo-500 to-sky-500 text-white shadow-md" 
                      : "bg-white text-gray-700 hover:bg-gray-50 ring-1 ring-inset ring-gray-200"}`}
                  >
                    Grade {grade}
                  </button>
                ))}
              </div>
            </div>
          </div>
          
          {/* AI Processing Section */}
          {filteredDocuments.length > 0 && (
            <div className="mb-8 rounded-3xl border bg-gradient-to-r from-purple-100 via-pink-100 to-indigo-100 p-8 shadow-lg">
              <div className="flex items-center gap-4 mb-6">
                <div className="rounded-full bg-gradient-to-r from-purple-500 to-pink-500 p-3">
                  <Database className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-purple-900">AI Content Processing</h2>
                  <p className="text-purple-900/70">Enable AI-powered content generation by processing your textbooks and curriculum documents.</p>
                </div>
              </div>
              
              {/* Processing Stats */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                  <div className="text-2xl font-bold text-green-900">
                    {filteredDocuments.filter(doc => isDocumentProcessed(doc)).length}
                  </div>
                  <div className="text-sm text-green-700">Ready for AI</div>
                </div>
                <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                  <div className="text-2xl font-bold text-orange-900">
                    {filteredDocuments.filter(doc => !isDocumentProcessed(doc)).length}
                  </div>
                  <div className="text-sm text-orange-700">Needs Processing</div>
                </div>
                <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                  <div className="text-2xl font-bold text-blue-900">
                    {selectedForProcessing.length}
                  </div>
                  <div className="text-sm text-blue-700">Selected</div>
                </div>
                <div className="rounded-2xl bg-white/60 backdrop-blur p-4">
                  <div className="text-2xl font-bold text-purple-900">
                    {Object.values(documentProcessingStatus).reduce((sum, status) => sum + (status.chunks || 0), 0)}
                  </div>
                  <div className="text-sm text-purple-700">Total AI Chunks</div>
                </div>
              </div>
              
              {/* Processing Controls */}
              {filteredDocuments.some(doc => !isDocumentProcessed(doc)) && (
                <div className="rounded-2xl bg-white/60 backdrop-blur p-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="text-lg font-semibold text-gray-900">Process Documents for AI</h3>
                      <p className="text-sm text-gray-600">Select documents below to enable AI content generation</p>
                    </div>
                    <button
                      onClick={handleProcessSelected}
                      disabled={selectedForProcessing.length === 0 || processing}
                      className={`inline-flex items-center gap-2 rounded-xl px-6 py-3 font-semibold shadow-lg transition-all ${
                        selectedForProcessing.length > 0 && !processing
                          ? "bg-gradient-to-r from-purple-500 to-pink-500 text-white hover:brightness-110 hover:shadow-xl"
                          : "bg-gray-300 text-gray-500 cursor-not-allowed"
                      }`}
                    >
                      {processing ? (
                        <>
                          <Settings className="h-5 w-5 animate-spin" />
                          Processing...
                        </>
                      ) : (
                        <>
                          <Zap className="h-5 w-5" />
                          Process Selected ({selectedForProcessing.length})
                        </>
                      )}
                    </button>
                  </div>
                  
                  {selectedForProcessing.length > 0 && (
                    <div className="text-sm text-gray-600 bg-indigo-50 rounded-lg p-3">
                      <p className="flex items-center">
                        <Clock className="h-4 w-4 mr-2 text-indigo-600" />
                        Processing will extract text and prepare content for AI integration. This typically takes 1-3 minutes per document.
                      </p>
                    </div>
                  )}
                </div>
              )}
              
              {/* Processing Progress */}
              {Object.keys(processingProgress).length > 0 && (
                <div className="mt-6 space-y-3">
                  <h4 className="font-semibold text-gray-900">Processing Status</h4>
                  {Object.entries(processingProgress).map(([docId, progress]) => {
                    const doc = documents.find(d => (d.id || d.path) === docId);
                    return (
                      <div key={docId} className="rounded-lg bg-white/80 p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-900">{doc?.name}</span>
                          <div className="flex items-center gap-2">
                            {progress.status === 'processing' && <Settings className="h-4 w-4 animate-spin text-blue-500" />}
                            {progress.status === 'completed' && <CheckCircle className="h-4 w-4 text-green-500" />}
                            {progress.status === 'error' && <AlertCircle className="h-4 w-4 text-red-500" />}
                            <span className={`text-sm font-medium ${
                              progress.status === 'completed' ? 'text-green-600' :
                              progress.status === 'error' ? 'text-red-600' : 'text-blue-600'
                            }`}>
                              {progress.progress}%
                            </span>
                          </div>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2 mb-2">
                          <div 
                            className={`h-2 rounded-full transition-all duration-300 ${
                              progress.status === 'completed' ? 'bg-green-500' :
                              progress.status === 'error' ? 'bg-red-500' : 'bg-blue-500'
                            }`}
                            style={{ width: `${progress.progress}%` }}
                          ></div>
                        </div>
                        {progress.message && (
                          <p className="text-sm text-gray-600">{progress.message}</p>
                        )}
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
          
          {/* Documents grid */}
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
              <span className="ml-2 text-gray-600">Loading documents...</span>
            </div>
          ) : error ? (
            <div className="rounded-xl bg-red-50 p-6 text-center">
              <p className="text-red-800">{error}</p>
              <button 
                onClick={() => window.location.reload()} 
                className="mt-4 rounded-lg bg-red-100 px-4 py-2 text-sm font-medium text-red-800 hover:bg-red-200"
              >
                Retry
              </button>
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="rounded-2xl border bg-white/80 p-12 backdrop-blur text-center shadow-lg">
              <div className="mx-auto w-24 h-24 rounded-full bg-gradient-to-br from-indigo-100 to-purple-100 flex items-center justify-center mb-6">
                <Upload className="h-12 w-12 text-indigo-600" />
              </div>
              <h3 className="text-2xl font-semibold text-gray-900 mb-3">No documents found</h3>
              <p className="text-gray-600 max-w-md mx-auto mb-6">
                {selectedGrade !== null 
                  ? `No ${filterType !== "all" ? filterType + " " : ""}documents found for Grade ${selectedGrade}.` 
                  : filterType !== "all" 
                    ? `No ${filterType} documents are available.`
                    : "No documents are available in the system."}
              </p>
              
              {/* Upload encouragement */}
              <div className="bg-gradient-to-r from-indigo-50 to-purple-50 rounded-2xl p-6 max-w-2xl mx-auto mb-6">
                <h4 className="font-semibold text-indigo-900 mb-3">Ready to add some content?</h4>
                <p className="text-indigo-700 text-sm mb-4">
                  Upload PDF textbooks and curriculum guides to build your educational library. 
                  Documents are automatically organized by grade level and type.
                </p>
                <button
                  onClick={() => {
                    setShowUpload(true);
                    setSelectedFileName(null);
                    setError(null);
                    setUploadSuccess(null);
                  }}
                  className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 to-purple-500 px-6 py-3 text-white font-medium hover:brightness-105 transition-all shadow-lg hover:shadow-xl"
                >
                  <Plus className="h-5 w-5" />
                  Upload Your First Document
                </button>
              </div>
              
              {/* Technical info */}
              <div className="mt-6 rounded-lg bg-blue-50 p-4 text-sm text-blue-700 inline-block max-w-xl mx-auto">
                <p className="flex items-start">
                  <svg className="h-5 w-5 text-blue-400 mr-2 mt-0.5 flex-shrink-0" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a.75.75 0 000 1.5h.253a.25.25 0 01.244.304l-.459 2.066A1.75 1.75 0 0010.747 15H11a.75.75 0 000-1.5h-.253a.25.25 0 01-.244-.304l.459-2.066A1.75 1.75 0 009.253 9H9z" clipRule="evenodd" />
                  </svg>
                  <span>
                    Documents are stored securely in Supabase storage buckets: <span className="font-semibold">"textbook_content"</span> and <span className="font-semibold">"Curriculums"</span>, organized by grade folders.
                  </span>
                </p>
              </div>
            </div>
          ) : (
            <>
              <div className="mb-4 flex justify-between items-center">
                <div className="rounded-lg bg-indigo-50 px-3 py-1 text-xs font-medium text-indigo-700 flex items-center">
                  <span className="mr-2">{filteredDocuments.length} {filterType !== "all" ? filterType : ""} document{filteredDocuments.length !== 1 ? "s" : ""}</span>
                  {selectedGrade !== null && (
                    <span className="inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-800">
                      Grade {selectedGrade}
                    </span>
                  )}
                </div>
              </div>
              
              <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                {filteredDocuments.map((doc, index) => (
                  <div 
                    key={index} 
                    className="group relative overflow-hidden rounded-xl border bg-white/80 backdrop-blur p-6 shadow-lg hover:shadow-xl transition-all"
                  >
                    <div className="absolute -right-4 -top-4 rounded-full bg-gray-50 p-8"></div>
                    
                    {/* Processing Status Badge */}
                    <div className="absolute right-4 top-4 flex gap-2">
                      <div className={`rounded-full p-2 ${
                        doc.type === "textbook" ? "bg-blue-100" : "bg-green-100"
                      }`}>
                        {doc.type === "textbook" 
                          ? <Book className="h-5 w-5 text-blue-600" /> 
                          : <FileText className="h-5 w-5 text-green-600" />
                        }
                      </div>
                      
                      {isDocumentProcessed(doc) ? (
                        <div className="bg-green-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <CheckCircle className="h-3 w-3" />
                          AI Ready
                        </div>
                      ) : (
                        <div className="bg-orange-500 text-white px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          Needs Processing
                        </div>
                      )}
                    </div>
                    
                    {/* Selection Checkbox */}
                    {!isDocumentProcessed(doc) && (doc.id || doc.path) && (
                      <div className="absolute top-4 left-4 z-10">
                        <input
                          type="checkbox"
                          checked={selectedForProcessing.includes((doc.id || doc.path)!)}
                          onChange={() => toggleDocumentSelection((doc.id || doc.path)!)}
                          className="w-5 h-5 text-purple-600 bg-white border-2 border-gray-300 rounded focus:ring-purple-500 focus:ring-2"
                        />
                      </div>
                    )}
                    
                    <div className="mb-4">
                      <span className={`inline-block rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        doc.type === "textbook" 
                          ? "bg-blue-50 text-blue-700" 
                          : "bg-green-50 text-green-700"
                      }`}>
                        {doc.type === "textbook" ? "Textbook" : "Curriculum"}
                      </span>
                      <span className="ml-2 inline-block rounded-full bg-purple-50 px-2.5 py-0.5 text-xs font-medium text-purple-700">
                        Grade {doc.grade}
                      </span>
                    </div>
                    
                    <h3 className="mb-2 text-lg font-medium text-gray-900 line-clamp-2">{doc.name}</h3>
                    
                    {/* Processing Info */}
                    {(() => {
                      const info = getProcessingInfo(doc);
                      return (info.chunks || 0) > 0 ? (
                        <p className="text-sm text-green-700 mb-2">
                          Ready for AI: {info.chunks} content chunks available
                        </p>
                      ) : info.error ? (
                        <p className="text-sm text-red-700 mb-2">
                          Processing error: {info.error}
                        </p>
                      ) : (
                        <p className="text-sm text-orange-700 mb-2">
                          Ready to process for AI integration
                        </p>
                      );
                    })()}
                    
                    <div className="mt-4 flex gap-2">
                      <button 
                        onClick={() => setViewingDocument(doc)}
                        className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-50 px-3.5 py-2 text-sm font-medium text-indigo-700 hover:bg-indigo-100"
                      >
                        <Eye className="h-4 w-4" />
                        View
                      </button>
                      {doc.bucket && doc.path && (
                        <button 
                          onClick={() => handleDelete(doc)}
                          className="inline-flex items-center gap-1.5 rounded-lg bg-red-50 px-3.5 py-2 text-sm font-medium text-red-700 hover:bg-red-100"
                        >
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {/* Upload Modal */}
          {showUpload && (
            <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
              <div className="bg-white rounded-xl w-full max-w-lg shadow-xl">
                <div className="flex items-center justify-between border-b p-6">
                  <div>
                    <h3 className="text-xl font-semibold text-gray-900">Upload Document</h3>
                    <p className="text-sm text-gray-600 mt-1">Add a new textbook or curriculum document</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowUpload(false);
                      setError(null);
                      setUploadSuccess(null);
                      setUploadProgress(0);
                      setSelectedFileName(null);
                    }}
                    className="rounded-full p-2 hover:bg-gray-100 transition-colors"
                    disabled={uploading}
                  >
                    <svg className="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                
                <form onSubmit={async (e) => {
                  e.preventDefault();
                  const formData = new FormData(e.currentTarget);
                  await handleUpload(formData);
                }}>
                  <div className="p-6 space-y-6">
                    {/* Error/Success Messages */}
                    {error && (
                      <div className="rounded-lg bg-red-50 border border-red-200 p-4">
                        <div className="flex">
                          <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm text-red-800">{error}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {uploadSuccess && (
                      <div className="rounded-lg bg-green-50 border border-green-200 p-4">
                        <div className="flex">
                          <svg className="h-5 w-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <div className="ml-3">
                            <p className="text-sm text-green-800">{uploadSuccess}</p>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {/* Document Type */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-3">
                        Document Type <span className="text-red-500">*</span>
                      </label>
                      <div className="grid grid-cols-2 gap-3">
                        <label className="relative">
                          <input 
                            type="radio" 
                            name="type" 
                            value="textbook" 
                            required 
                            className="sr-only peer"
                          />
                          <div className="flex items-center p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-blue-300 peer-checked:border-blue-500 peer-checked:bg-blue-50 transition-all">
                            <Book className="h-5 w-5 text-blue-600 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">Textbook</div>
                              <div className="text-sm text-gray-500">Student learning material</div>
                            </div>
                          </div>
                        </label>
                        <label className="relative">
                          <input 
                            type="radio" 
                            name="type" 
                            value="curriculum" 
                            required 
                            className="sr-only peer"
                          />
                          <div className="flex items-center p-4 rounded-lg border-2 border-gray-200 cursor-pointer hover:border-green-300 peer-checked:border-green-500 peer-checked:bg-green-50 transition-all">
                            <FileText className="h-5 w-5 text-green-600 mr-3" />
                            <div>
                              <div className="font-medium text-gray-900">Curriculum</div>
                              <div className="text-sm text-gray-500">Teaching guide</div>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>
                    
                    {/* Grade Level */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        Grade Level <span className="text-red-500">*</span>
                      </label>
                      <select 
                        name="grade" 
                        required 
                        className="w-full rounded-lg border-gray-300 px-4 py-3 text-sm focus:border-indigo-500 focus:ring-indigo-500 shadow-sm"
                      >
                        <option value="">Select grade level...</option>
                        {[1,2,3,4,5,6,7,8,9,10,11,12].map(grade => (
                          <option key={grade} value={grade}>Grade {grade}</option>
                        ))}
                      </select>
                    </div>
                    
                    {/* File Upload with Drag & Drop */}
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">
                        PDF Document <span className="text-red-500">*</span>
                      </label>
                      <div 
                        className={`relative rounded-lg border-2 border-dashed p-8 text-center transition-all ${
                          selectedFileName
                            ? "border-green-400 bg-green-50"
                            : dragActive 
                              ? "border-indigo-400 bg-indigo-50" 
                              : "border-gray-300 hover:border-gray-400"
                        }`}
                        onDragEnter={handleDrag}
                        onDragLeave={handleDrag}
                        onDragOver={handleDrag}
                        onDrop={handleDrop}
                      >
                        <input 
                          type="file" 
                          name="file" 
                          accept=".pdf"
                          required 
                          className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (file && file.type !== "application/pdf") {
                              setError("Only PDF files are allowed");
                              setSelectedFileName(null);
                              e.target.value = "";
                            } else if (file) {
                              setError(null);
                              setSelectedFileName(file.name);
                            } else {
                              setSelectedFileName(null);
                            }
                          }}
                        />
                        
                        {selectedFileName ? (
                          // Show selected file
                          <div className="space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-green-100 flex items-center justify-center">
                              <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">File selected:</p>
                              <p className="text-sm text-indigo-600 font-medium mt-1 break-all">{selectedFileName}</p>
                              <p className="text-xs text-gray-500 mt-1">Click to change file</p>
                            </div>
                          </div>
                        ) : (
                          // Show upload prompt
                          <div className="space-y-3">
                            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center">
                              <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-sm font-medium text-gray-900">
                                {dragActive ? "Drop your PDF here" : "Click to upload or drag and drop"}
                              </p>
                              <p className="text-xs text-gray-500 mt-1">PDF files only, up to 50MB</p>
                            </div>
                          </div>
                        )}
                      </div>
                    </div>
                    
                    {/* Upload Progress */}
                    {uploading && (
                      <div className="space-y-2">
                        <div className="flex justify-between text-sm">
                          <span className="text-gray-700">Uploading...</span>
                          <span className="text-gray-500">{uploadProgress}%</span>
                        </div>
                        <div className="w-full bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-indigo-600 h-2 rounded-full transition-all duration-300 ease-out" 
                            style={{ width: `${uploadProgress}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                  
                  <div className="flex gap-3 border-t bg-gray-50 px-6 py-4 rounded-b-xl">
                    <button
                      type="button"
                      onClick={() => {
                        setShowUpload(false);
                        setError(null);
                        setUploadSuccess(null);
                        setUploadProgress(0);
                        setSelectedFileName(null);
                      }}
                      disabled={uploading}
                      className="flex-1 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={uploading || uploadSuccess !== null}
                      className="flex-1 rounded-lg bg-indigo-600 px-4 py-2.5 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2 transition-colors"
                    >
                      {uploading ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Uploading...
                        </>
                      ) : uploadSuccess ? (
                        <>
                          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          Success!
                        </>
                      ) : (
                        <>
                          <Plus className="h-4 w-4" />
                          Upload Document
                        </>
                      )}
                    </button>
                  </div>
                </form>
              </div>
            </div>
          )}

          {/* PDF Viewer Modal */}
          {viewingDocument && (
            <PDFViewer
              url={viewingDocument.url}
              title={viewingDocument.name}
              onClose={() => setViewingDocument(null)}
              publicUrl={viewingDocument.publicUrl}
              signedUrl={viewingDocument.signedUrl}
              bucket={viewingDocument.bucket}
              path={viewingDocument.path}
            />
          )}
        </main>
      </RoleGuard>
    </div>
  );
}
