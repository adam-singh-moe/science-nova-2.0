"use client"

import { useState, useEffect } from "react"
import { supabase } from "@/lib/supabase"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { Textarea } from "@/components/ui/textarea"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Search, TestTube, Database, Eye, Zap, Copy, CheckCircle } from "lucide-react"
import { useToast } from "@/hooks/use-toast"
import { theme } from "@/lib/theme"

interface TestResult {
  searchParameters: {
    query: string
    gradeLevel: number
    studyArea: string
    topicTitle: string
    maxResults: number
    minSimilarity: number
  }
  searchResults: {
    totalFound: number
    averageSimilarity: string
    highestSimilarity: string
    lowestSimilarity: string
  }
  contentChunks: Array<{
    rank: number
    id: string
    similarity: string
    contentPreview: string
    fullContent: string
    metadata: any
    wordCount: number
    characterCount: number
  }>
  formattedAIPrompt: {
    promptLength: number
    wordCount: number
    fullPrompt: string
    preview: string
  }
  gradeStatistics: {
    totalChunksInGrade: number
    availableFiles: string[]
    lastProcessed: string | null
    chunkDistribution: Record<string, number>
  }
  testingSummary: {
    contentAvailable: boolean
    qualityScore: string
    recommendedMinSimilarity: string
    aiPromptReady: boolean
  }
}

interface SampleQuery {
  query: string
  studyArea: string
  description: string
}

export default function TextbookTestPage() {
  const { toast } = useToast()
  const [loading, setLoading] = useState(false)
  const [testResult, setTestResult] = useState<TestResult | null>(null)
  const [sampleQueries, setSampleQueries] = useState<Record<number, SampleQuery[]>>({})
  const [copiedStates, setCopiedStates] = useState<Record<string, boolean>>({})
  // Form state
  const [query, setQuery] = useState("")
  const [gradeLevel, setGradeLevel] = useState<number>(3)
  const [studyArea, setStudyArea] = useState("any")
  const [topicTitle, setTopicTitle] = useState("")
  const [maxResults, setMaxResults] = useState(10)
  const [minSimilarity, setMinSimilarity] = useState(0.5)

  const studyAreas = [
    "Biology", "Physics", "Chemistry", "Geology", 
    "Meteorology", "Astronomy", "Anatomy"
  ]

  const handleTest = async () => {
    if (!query.trim()) {
      toast({
        title: "Error",
        description: "Please enter a search query",
        variant: "destructive"
      })
      return
    }    setLoading(true)
    
    try {
      // Get the current session to pass the token
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/test-textbook-content', {
        method: 'POST',
        credentials: 'include',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },body: JSON.stringify({
          query: query.trim(),
          gradeLevel,
          studyArea: studyArea && studyArea !== "any" ? studyArea : undefined,
          topicTitle: topicTitle || undefined,
          maxResults,
          minSimilarity
        })
      })

      const result = await response.json()

      if (result.success) {
        setTestResult(result.testResults)
        toast({
          title: "Test Complete",
          description: `Found ${result.testResults.searchResults.totalFound} relevant chunks`,
        })
      } else {
        throw new Error(result.message || 'Test failed')
      }
    } catch (error) {
      console.error('Test error:', error)
      toast({
        title: "Test Failed",
        description: error instanceof Error ? error.message : "Unknown error",
        variant: "destructive"
      })
    } finally {
      setLoading(false)
    }
  }
  const loadSampleQueries = async () => {
    // Only run on client side
    if (typeof window === 'undefined') {
      console.log('loadSampleQueries called during SSG, skipping')
      return
    }

    try {
      // Get the current session to pass the token
      const { data: { session } } = await supabase.auth.getSession()
      
      const response = await fetch('/api/test-textbook-content', {
        credentials: 'include',
        headers: {
          'Authorization': session?.access_token ? `Bearer ${session.access_token}` : '',
        },
      })
      const result = await response.json()
      
      if (result.success) {
        const queriesByGrade: Record<number, SampleQuery[]> = {}
        result.sampleQueries.forEach((sq: any) => {
          queriesByGrade[sq.grade] = sq.queries
        })
        setSampleQueries(queriesByGrade)
      }
    } catch (error) {
      console.error('Error loading sample queries:', error)
    }
  }

  const applySampleQuery = (sampleQuery: SampleQuery) => {
    setQuery(sampleQuery.query)
    setStudyArea(sampleQuery.studyArea)
    setTopicTitle("")
  }

  const copyToClipboard = async (text: string, type: string) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedStates(prev => ({ ...prev, [type]: true }))
      setTimeout(() => {
        setCopiedStates(prev => ({ ...prev, [type]: false }))
      }, 2000)
      toast({
        title: "Copied",
        description: `${type} copied to clipboard`,
      })
    } catch (error) {
      toast({
        title: "Copy Failed",
        description: "Failed to copy to clipboard",
        variant: "destructive"
      })
    }
  }

  // Load sample queries on component mount
  useEffect(() => {
    loadSampleQueries()
  }, [])

  return (
    <div className="min-h-screen p-6">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-8">
          <h1 className={`text-4xl font-bold text-transparent bg-clip-text ${theme.gradient.header} mb-2 flex items-center gap-3`}>
            <TestTube className={`h-10 w-10 ${theme.icon.accent}`} />
            Textbook Content Testing
          </h1>
          <p className={`${theme.text.secondary} text-lg`}>
            Test and inspect textbook content retrieval for AI content generation
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Test Form */}
          <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2`}>
            <CardHeader>
              <CardTitle className={`${theme.text.primary} flex items-center gap-2`}>
                <Search className="h-5 w-5" />
                Search Parameters
              </CardTitle>
              <CardDescription className={theme.text.secondary}>
                Configure your textbook content search test
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <Label htmlFor="query" className={theme.text.primary}>Search Query *</Label>
                <Input
                  id="query"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="e.g., 'water cycle', 'photosynthesis', 'simple machines'"
                  className={`${theme.border.secondary} border-2`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="gradeLevel" className={theme.text.primary}>Grade Level *</Label>
                  <Select value={gradeLevel.toString()} onValueChange={(value) => setGradeLevel(parseInt(value))}>
                    <SelectTrigger className={`${theme.border.secondary} border-2`}>
                      <SelectValue placeholder="Select grade" />
                    </SelectTrigger>
                    <SelectContent>
                      {[1, 2, 3, 4, 5, 6].map(grade => (
                        <SelectItem key={grade} value={grade.toString()}>
                          Grade {grade}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label htmlFor="studyArea" className={theme.text.primary}>Study Area</Label>
                  <Select value={studyArea} onValueChange={setStudyArea}>
                    <SelectTrigger className={`${theme.border.secondary} border-2`}>
                      <SelectValue placeholder="Optional" />
                    </SelectTrigger>                    <SelectContent>
                      <SelectItem value="any">Any Subject</SelectItem>
                      {studyAreas.map(area => (
                        <SelectItem key={area} value={area}>{area}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div>
                <Label htmlFor="topicTitle" className={theme.text.primary}>Topic Title</Label>
                <Input
                  id="topicTitle"
                  value={topicTitle}
                  onChange={(e) => setTopicTitle(e.target.value)}
                  placeholder="Optional: specific topic name"
                  className={`${theme.border.secondary} border-2`}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="maxResults" className={theme.text.primary}>Max Results</Label>
                  <Input
                    id="maxResults"
                    type="number"
                    value={maxResults}
                    onChange={(e) => setMaxResults(parseInt(e.target.value) || 10)}
                    min="1"
                    max="50"
                    className={`${theme.border.secondary} border-2`}
                  />
                </div>

                <div>
                  <Label htmlFor="minSimilarity" className={theme.text.primary}>Min Similarity</Label>
                  <Input
                    id="minSimilarity"
                    type="number"
                    step="0.1"
                    value={minSimilarity}
                    onChange={(e) => setMinSimilarity(parseFloat(e.target.value) || 0.5)}
                    min="0"
                    max="1"
                    className={`${theme.border.secondary} border-2`}
                  />
                </div>
              </div>

              <Button 
                onClick={handleTest}
                disabled={loading}
                className={`w-full ${theme.button.primary} ${theme.border.primary} border-2`}
              >
                {loading ? (
                  <>
                    <TestTube className="h-4 w-4 mr-2 animate-pulse" />
                    Testing...
                  </>
                ) : (
                  <>
                    <Search className="h-4 w-4 mr-2" />
                    Run Test
                  </>
                )}
              </Button>

              {/* Sample Queries */}
              {sampleQueries[gradeLevel] && (
                <div className="mt-6">
                  <Label className={theme.text.primary}>Sample Queries for Grade {gradeLevel}</Label>
                  <div className="mt-2 space-y-2">
                    {sampleQueries[gradeLevel].map((sample, index) => (
                      <div 
                        key={index}
                        className={`p-2 rounded border cursor-pointer hover:bg-gray-50 ${theme.border.primary}`}
                        onClick={() => applySampleQuery(sample)}
                      >
                        <div className="flex items-center justify-between">
                          <span className={`font-medium ${theme.text.primary}`}>{sample.query}</span>
                          <Badge>{sample.studyArea}</Badge>
                        </div>
                        <p className={`text-sm ${theme.text.muted}`}>{sample.description}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Test Results */}
          {testResult && (
            <Card className={`backdrop-blur-lg ${theme.background.card} ${theme.border.secondary} border-2`}>
              <CardHeader>
                <CardTitle className={`${theme.text.primary} flex items-center gap-2`}>
                  <Database className="h-5 w-5" />
                  Test Results
                </CardTitle>
                <CardDescription className={theme.text.secondary}>
                  Content retrieval and AI prompt analysis
                </CardDescription>
              </CardHeader>
              <CardContent>
                <Tabs defaultValue="summary" className="w-full">
                  <TabsList className="grid w-full grid-cols-4">
                    <TabsTrigger value="summary">Summary</TabsTrigger>
                    <TabsTrigger value="content">Content</TabsTrigger>
                    <TabsTrigger value="prompt">AI Prompt</TabsTrigger>
                    <TabsTrigger value="stats">Statistics</TabsTrigger>
                  </TabsList>

                  <TabsContent value="summary" className="space-y-4">
                    <div className={`p-4 rounded-lg ${theme.background.secondary} ${theme.border.primary} border`}>
                      <h4 className={`font-semibold ${theme.text.primary} mb-3`}>Search Results</h4>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className={`text-sm ${theme.text.muted}`}>Total Found</p>
                          <p className={`text-lg font-bold ${theme.text.primary}`}>
                            {testResult.searchResults.totalFound}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${theme.text.muted}`}>Quality Score</p>
                          <p className={`text-lg font-bold ${theme.text.primary}`}>
                            {testResult.testingSummary.qualityScore}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${theme.text.muted}`}>Avg Similarity</p>
                          <p className={`text-lg font-bold ${theme.text.primary}`}>
                            {testResult.searchResults.averageSimilarity}
                          </p>
                        </div>
                        <div>
                          <p className={`text-sm ${theme.text.muted}`}>AI Ready</p>
                          <p className={`text-lg font-bold ${testResult.testingSummary.aiPromptReady ? theme.text.secondary : theme.text.accent}`}>
                            {testResult.testingSummary.aiPromptReady ? 'Yes' : 'No'}
                          </p>
                        </div>
                      </div>
                    </div>

                    <div className={`p-4 rounded-lg ${theme.background.secondary} ${theme.border.primary} border`}>
                      <h4 className={`font-semibold ${theme.text.primary} mb-2`}>Recommendations</h4>
                      <ul className={`text-sm ${theme.text.secondary} space-y-1`}>
                        <li>• Recommended min similarity: {testResult.testingSummary.recommendedMinSimilarity}</li>
                        <li>• Content quality: {testResult.testingSummary.qualityScore} of chunks above 70% similarity</li>
                        <li>• Total chunks available for grade: {testResult.gradeStatistics.totalChunksInGrade}</li>
                      </ul>
                    </div>
                  </TabsContent>

                  <TabsContent value="content" className="space-y-4">
                    <ScrollArea className="h-96">
                      {testResult.contentChunks.map((chunk) => (
                        <div key={chunk.id} className={`p-3 mb-3 rounded-lg ${theme.background.secondary} ${theme.border.primary} border`}>
                          <div className="flex items-center justify-between mb-2">
                            <Badge>Rank #{chunk.rank}</Badge>
                            <Badge className="bg-blue-500/60">Similarity: {chunk.similarity}</Badge>
                          </div>
                          <p className={`text-sm ${theme.text.primary} mb-2`}>
                            <strong>Preview:</strong> {chunk.contentPreview}
                          </p>
                          <div className="flex items-center gap-4 text-xs text-gray-500">
                            <span>Words: {chunk.wordCount}</span>
                            <span>Characters: {chunk.characterCount}</span>
                            <Button 
                              size="sm" 
                              variant="outline"
                              onClick={() => copyToClipboard(chunk.fullContent, `content-${chunk.id}`)}
                            >
                              {copiedStates[`content-${chunk.id}`] ? <CheckCircle className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                            </Button>
                          </div>
                        </div>
                      ))}
                    </ScrollArea>
                  </TabsContent>

                  <TabsContent value="prompt" className="space-y-4">
                    <div className={`p-4 rounded-lg ${theme.background.secondary} ${theme.border.primary} border`}>
                      <div className="flex items-center justify-between mb-3">
                        <h4 className={`font-semibold ${theme.text.primary}`}>AI Prompt Preview</h4>
                        <Button 
                          size="sm" 
                          variant="outline"
                          onClick={() => copyToClipboard(testResult.formattedAIPrompt.fullPrompt, 'prompt')}
                        >
                          {copiedStates.prompt ? <CheckCircle className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                          Copy Full Prompt
                        </Button>
                      </div>
                      <div className="grid grid-cols-2 gap-4 mb-4">
                        <div>
                          <p className={`text-sm ${theme.text.muted}`}>Length</p>
                          <p className={`font-bold ${theme.text.primary}`}>{testResult.formattedAIPrompt.promptLength} chars</p>
                        </div>
                        <div>
                          <p className={`text-sm ${theme.text.muted}`}>Words</p>
                          <p className={`font-bold ${theme.text.primary}`}>{testResult.formattedAIPrompt.wordCount}</p>
                        </div>
                      </div>
                      <Textarea
                        value={testResult.formattedAIPrompt.fullPrompt}
                        readOnly
                        rows={15}
                        className={`${theme.border.secondary} border-2 font-mono text-sm`}
                      />
                    </div>
                  </TabsContent>

                  <TabsContent value="stats" className="space-y-4">
                    <div className={`p-4 rounded-lg ${theme.background.secondary} ${theme.border.primary} border`}>
                      <h4 className={`font-semibold ${theme.text.primary} mb-3`}>Grade {testResult.searchParameters.gradeLevel} Statistics</h4>
                      <div className="space-y-2">
                        <p className={`text-sm ${theme.text.secondary}`}>
                          Total chunks: <strong>{testResult.gradeStatistics.totalChunksInGrade}</strong>
                        </p>
                        <p className={`text-sm ${theme.text.secondary}`}>
                          Available files: <strong>{testResult.gradeStatistics.availableFiles.join(', ') || 'None'}</strong>
                        </p>
                        <p className={`text-sm ${theme.text.secondary}`}>
                          Last processed: <strong>
                            {testResult.gradeStatistics.lastProcessed 
                              ? new Date(testResult.gradeStatistics.lastProcessed).toLocaleString()
                              : 'Never'
                            }
                          </strong>
                        </p>
                      </div>
                    </div>

                    {Object.keys(testResult.gradeStatistics.chunkDistribution).length > 0 && (
                      <div className={`p-4 rounded-lg ${theme.background.secondary} ${theme.border.primary} border`}>
                        <h4 className={`font-semibold ${theme.text.primary} mb-3`}>Chunk Distribution by File</h4>
                        {Object.entries(testResult.gradeStatistics.chunkDistribution).map(([fileName, count]) => (
                          <div key={fileName} className="flex justify-between items-center py-1">
                            <span className={`text-sm ${theme.text.primary}`}>{fileName}</span>
                            <Badge>{count} chunks</Badge>
                          </div>
                        ))}
                      </div>
                    )}
                  </TabsContent>
                </Tabs>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  )
}
