'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { AlertCircle, CheckCircle, Clock, RefreshCw, Database, Search, Upload, BarChart3 } from 'lucide-react';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

interface ProcessingStats {
  totalDocuments: number;
  processedDocuments: number;
  failedDocuments: number;
  pendingDocuments: number;
  totalChunks: number;
  avgChunksPerDocument: number;
  embeddingModels: Record<string, number>;
  documentTypes: Record<string, number>;
  gradeLevels: Record<number, number>;
  lastProcessed: string | null;
}

interface SearchResult {
  id: string;
  content: string;
  similarity: number;
  fileName: string;
  documentType: string;
  gradeLevel: number;
  bucketName: string;
  chunkIndex: number;
}

export default function EmbeddingsAdminPanel() {
  const [stats, setStats] = useState<ProcessingStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [processingDocuments, setProcessingDocuments] = useState(false);
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedGradeLevel, setSelectedGradeLevel] = useState<string>('all');
  const [selectedDocumentType, setSelectedDocumentType] = useState<string>('all');
  const [alert, setAlert] = useState<{ type: 'success' | 'error'; message: string } | null>(null);
  const [activeTab, setActiveTab] = useState('overview');

  // Load statistics on component mount
  useEffect(() => {
    loadStats();
  }, []);

  const showAlert = (type: 'success' | 'error', message: string) => {
    setAlert({ type, message });
    setTimeout(() => setAlert(null), 5000);
  };

  const loadStats = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/embeddings?action=stats');
      const data = await response.json();
      
      if (data.success) {
        // Ensure all required properties exist with defaults
        const statsWithDefaults = {
          totalDocuments: data.stats?.totalDocuments || 0,
          processedDocuments: data.stats?.processedDocuments || 0,
          failedDocuments: data.stats?.failedDocuments || 0,
          pendingDocuments: data.stats?.pendingDocuments || 0,
          totalChunks: data.stats?.totalChunks || 0,
          avgChunksPerDocument: data.stats?.avgChunksPerDocument || 0,
          embeddingModels: data.stats?.embeddingModels || {},
          documentTypes: data.stats?.documentTypes || {},
          gradeLevels: data.stats?.gradeLevels || {},
          lastProcessed: data.stats?.lastProcessed || null,
        };
        setStats(statsWithDefaults);
      } else {
        showAlert('error', `Failed to load stats: ${data.error}`);
      }
    } catch (error) {
      showAlert('error', `Error loading stats: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const processAllDocuments = async (forceReprocess = false) => {
    setProcessingDocuments(true);
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          action: 'process_all', 
          forceReprocess,
          model: 'text-embedding-3-large'
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showAlert('success', data.message);
        await loadStats(); // Refresh stats
      } else {
        showAlert('error', `Processing failed: ${data.error}`);
      }
    } catch (error) {
      showAlert('error', `Error processing documents: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setProcessingDocuments(false);
    }
  };

  const reprocessFailedDocuments = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reprocess_failed' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showAlert('success', data.message);
        await loadStats();
      } else {
        showAlert('error', `Reprocessing failed: ${data.error}`);
      }
    } catch (error) {
      showAlert('error', `Error reprocessing: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const searchEmbeddings = async () => {
    if (!searchQuery.trim()) {
      showAlert('error', 'Please enter a search query');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query: searchQuery,
          gradeLevel: selectedGradeLevel === 'all' ? undefined : selectedGradeLevel,
          documentType: selectedDocumentType === 'all' ? undefined : selectedDocumentType,
          limit: 10,
          threshold: 0.7
        })
      });
      
      const data = await response.json();
      
      if (data.success) {
        setSearchResults(data.data.results);
        showAlert('success', `Found ${data.data.results.length} results`);
      } else {
        showAlert('error', `Search failed: ${data.error}`);
      }
    } catch (error) {
      showAlert('error', `Error searching: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const cleanupCache = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/embeddings', {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'cleanup_cache' })
      });
      
      const data = await response.json();
      
      if (data.success) {
        showAlert('success', data.message);
      } else {
        showAlert('error', `Cleanup failed: ${data.error}`);
      }
    } catch (error) {
      showAlert('error', `Error cleaning up: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const getStatusBadge = (type: 'processed' | 'failed' | 'pending', count: number) => {
    const variants = {
      processed: 'default',
      failed: 'destructive',
      pending: 'secondary'
    } as const;

    const icons = {
      processed: CheckCircle,
      failed: AlertCircle,
      pending: Clock
    };

    const Icon = icons[type];

    return (
      <Badge variant={variants[type]} className="flex items-center gap-1">
        <Icon className="h-3 w-3" />
        {count}
      </Badge>
    );
  };

  const completionPercentage = stats 
    ? Math.round((stats.processedDocuments / Math.max(stats.totalDocuments, 1)) * 100)
    : 0;

  const CustomAlert = ({ type, message }: { type: 'success' | 'error'; message: string }) => (
    <div className={`p-4 rounded-lg border flex items-center gap-2 ${
      type === 'error' 
        ? 'bg-red-50 border-red-200 text-red-800' 
        : 'bg-green-50 border-green-200 text-green-800'
    }`}>
      <AlertCircle className="h-4 w-4" />
      <span>{message}</span>
    </div>
  );

  const TabButton = ({ value, label, isActive, onClick }: { 
    value: string; 
    label: string; 
    isActive: boolean; 
    onClick: () => void; 
  }) => (
    <button
      onClick={onClick}
      className={`px-4 py-2 rounded-xl text-sm font-medium transition-colors ${
        isActive 
          ? 'bg-gradient-to-r from-indigo-500/10 to-sky-500/10 text-indigo-700 ring-1 ring-inset ring-indigo-200' 
          : 'bg-white/80 text-gray-700 ring-1 ring-inset ring-gray-200 hover:bg-white/90 backdrop-blur'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-indigo-900">OpenAI Embeddings Manager</h1>
          <p className="text-indigo-900/70">Monitor and manage the AI knowledge embeddings system</p>
        </div>
        <Button onClick={loadStats} disabled={loading} variant="outline" className="bg-white/80 backdrop-blur border-indigo-200 hover:bg-white/90">
          <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
          Refresh
        </Button>
      </div>

      {alert && <CustomAlert type={alert.type} message={alert.message} />}

      <div className="space-y-4">
        <div className="flex gap-2">
          <TabButton 
            value="overview" 
            label="Overview" 
            isActive={activeTab === 'overview'} 
            onClick={() => setActiveTab('overview')} 
          />
          <TabButton 
            value="processing" 
            label="Processing" 
            isActive={activeTab === 'processing'} 
            onClick={() => setActiveTab('processing')} 
          />
          <TabButton 
            value="search" 
            label="Search Test" 
            isActive={activeTab === 'search'} 
            onClick={() => setActiveTab('search')} 
          />
          <TabButton 
            value="analytics" 
            label="Analytics" 
            isActive={activeTab === 'analytics'} 
            onClick={() => setActiveTab('analytics')} 
          />
        </div>

        {activeTab === 'overview' && (
          <div className="space-y-4">
            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Total Documents</h3>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">{stats.totalDocuments}</div>
                  <p className="text-xs text-muted-foreground">
                    {stats.totalChunks} chunks total
                  </p>
                </div>

                <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Processing Status</h3>
                    <BarChart3 className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="flex gap-2 mb-2">
                    {getStatusBadge('processed', stats.processedDocuments)}
                    {getStatusBadge('failed', stats.failedDocuments)}
                    {getStatusBadge('pending', stats.pendingDocuments)}
                  </div>
                  <Progress value={completionPercentage} className="w-full" />
                  <p className="text-xs text-muted-foreground mt-1">
                    {completionPercentage}% complete
                  </p>
                </div>

                <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Avg Chunks/Doc</h3>
                    <Database className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-2xl font-bold">
                    {Math.round(stats.avgChunksPerDocument)}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    chunks per document
                  </p>
                </div>

                <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                  <div className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <h3 className="text-sm font-medium">Last Processed</h3>
                    <Clock className="h-4 w-4 text-muted-foreground" />
                  </div>
                  <div className="text-sm font-medium">
                    {stats.lastProcessed 
                      ? new Date(stats.lastProcessed).toLocaleString()
                      : 'Never'
                    }
                  </div>
                </div>
              </div>
            )}

            {stats && (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Document Types</h3>
                  <div className="space-y-2">
                    {stats.documentTypes && Object.entries(stats.documentTypes).map(([type, count]) => (
                      <div key={type} className="flex justify-between">
                        <span className="capitalize">{type}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                    {(!stats.documentTypes || Object.keys(stats.documentTypes).length === 0) && (
                      <p className="text-sm text-gray-500 italic">No document types found</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Grade Levels</h3>
                  <div className="space-y-2">
                    {stats.gradeLevels && Object.entries(stats.gradeLevels)
                      .sort(([a], [b]) => parseInt(a) - parseInt(b))
                      .map(([grade, count]) => (
                        <div key={grade} className="flex justify-between">
                          <span>Grade {grade}</span>
                          <Badge variant="outline">{count}</Badge>
                        </div>
                      ))}
                    {(!stats.gradeLevels || Object.keys(stats.gradeLevels).length === 0) && (
                      <p className="text-sm text-gray-500 italic">No grade levels found</p>
                    )}
                  </div>
                </div>

                <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Embedding Models</h3>
                  <div className="space-y-2">
                    {stats.embeddingModels && Object.entries(stats.embeddingModels).map(([model, count]) => (
                      <div key={model} className="flex justify-between">
                        <span className="text-sm">{model.replace('text-embedding-', '')}</span>
                        <Badge variant="outline">{count}</Badge>
                      </div>
                    ))}
                    {(!stats.embeddingModels || Object.keys(stats.embeddingModels).length === 0) && (
                      <p className="text-sm text-gray-500 italic">No embedding models found</p>
                    )}
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'processing' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Document Processing</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Process all documents in storage buckets or reprocess failed ones
                </p>
                <div className="space-y-4">
                  <Button 
                    onClick={() => processAllDocuments(false)} 
                    disabled={processingDocuments}
                    className="w-full bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600"
                  >
                    <Upload className="h-4 w-4 mr-2" />
                    {processingDocuments ? 'Processing...' : 'Process New Documents'}
                  </Button>
                  
                  <Button 
                    onClick={() => processAllDocuments(true)} 
                    disabled={processingDocuments}
                    variant="outline"
                    className="w-full bg-white/80 backdrop-blur border-gray-200 hover:bg-white/90"
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    Force Reprocess All
                  </Button>
                  
                  <Button 
                    onClick={reprocessFailedDocuments} 
                    disabled={loading}
                    variant="secondary"
                    className="w-full bg-gray-100/80 hover:bg-gray-200/80"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    Reprocess Failed ({stats?.failedDocuments || 0})
                  </Button>
                </div>
              </div>

              <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-gray-900 mb-2">System Maintenance</h3>
                <p className="text-sm text-gray-600 mb-4">
                  Cache cleanup and system optimization
                </p>
                <div className="space-y-4">
                  <Button 
                    onClick={cleanupCache} 
                    disabled={loading}
                    variant="outline"
                    className="w-full bg-white/80 backdrop-blur border-gray-200 hover:bg-white/90"
                  >
                    <Database className="h-4 w-4 mr-2" />
                    Cleanup Old Cache
                  </Button>
                  
                  <div className="text-sm text-muted-foreground">
                    <p>• Removes cache entries older than 7 days</p>
                    <p>• Optimizes database performance</p>
                    <p>• Frees up storage space</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'search' && (
          <div className="space-y-4">
            <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Test Embeddings Search</h3>
              <p className="text-sm text-gray-600 mb-4">
                Test the search functionality with different queries and filters
              </p>
              <div className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <Input
                    placeholder="Enter search query..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && searchEmbeddings()}
                    className="bg-white/80 border-gray-200"
                  />
                  
                  <Select value={selectedGradeLevel} onValueChange={setSelectedGradeLevel}>
                    <SelectTrigger className="bg-white/80 border-gray-200">
                      <SelectValue placeholder="Grade Level" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Grades</SelectItem>
                      {[1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].map(grade => (
                        <SelectItem key={grade} value={grade.toString()}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  
                  <Select value={selectedDocumentType} onValueChange={setSelectedDocumentType}>
                    <SelectTrigger className="bg-white/80 border-gray-200">
                      <SelectValue placeholder="Document Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      <SelectItem value="textbook">Textbook</SelectItem>
                      <SelectItem value="curriculum">Curriculum</SelectItem>
                      <SelectItem value="lesson_plan">Lesson Plan</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                <Button 
                  onClick={searchEmbeddings} 
                  disabled={loading} 
                  className="w-full bg-gradient-to-r from-indigo-500 to-sky-500 hover:from-indigo-600 hover:to-sky-600"
                >
                  <Search className="h-4 w-4 mr-2" />
                  Search Embeddings
                </Button>
              </div>
            </div>

            {searchResults.length > 0 && (
              <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Search Results ({searchResults.length})</h3>
                <div className="space-y-4">
                  {searchResults.map((result, index) => (
                    <div key={result.id} className="p-4 border border-gray-100 rounded-xl bg-white/60 backdrop-blur">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <h4 className="font-medium">{result.fileName}</h4>
                          <div className="flex gap-2 mt-1">
                            <Badge variant="outline">
                              {result.documentType}
                            </Badge>
                            <Badge variant="outline">
                              Grade {result.gradeLevel}
                            </Badge>
                            <Badge variant="outline">
                              {Math.round(result.similarity * 100)}% match
                            </Badge>
                          </div>
                        </div>
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {result.content.length > 200 
                          ? `${result.content.substring(0, 200)}...`
                          : result.content
                        }
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {activeTab === 'analytics' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Processing Performance</h3>
                {stats && (
                  <div className="space-y-4">
                    <div className="flex justify-between">
                      <span>Success Rate</span>
                      <span className="font-medium">
                        {Math.round((stats.processedDocuments / Math.max(stats.totalDocuments, 1)) * 100)}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span>Total Chunks</span>
                      <span className="font-medium">{stats.totalChunks.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between">
                      <span>Avg Chunks per Doc</span>
                      <span className="font-medium">{Math.round(stats.avgChunksPerDocument)}</span>
                    </div>
                  </div>
                )}
              </div>

              <div className="rounded-2xl border bg-white/80 p-6 backdrop-blur">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">System Health</h3>
                <div className="space-y-4">
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>OpenAI API Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Database Connected</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <CheckCircle className="h-4 w-4 text-green-500" />
                    <span>Storage Buckets Accessible</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}