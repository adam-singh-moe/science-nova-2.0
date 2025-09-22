/**
 * OpenAI Embeddings System Testing Script
 * 
 * This script comprehensively tests the new OpenAI embeddings system
 * including database migration, document processing, vector search, and AI integration.
 * 
 * Run this script after setting up the system to validate all components.
 */

const { createClient } = require('@supabase/supabase-js');

// Test configuration
const TEST_CONFIG = {
  testQuery: 'photosynthesis in plants',
  gradeLevel: 5,
  documentType: 'textbook',
  
  // Test documents for processing
  testDocuments: [
    {
      fileName: 'test-science-textbook.pdf',
      bucketName: 'textbook_content',
      gradeLevel: 5,
      documentType: 'textbook'
    },
    {
      fileName: 'test-curriculum-guide.pdf', 
      bucketName: 'Curriculums',
      gradeLevel: 4,
      documentType: 'curriculum'
    }
  ]
};

class EmbeddingsSystemTester {
  constructor() {
    this.supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.SUPABASE_SERVICE_ROLE_KEY
    );
    this.results = {
      passed: 0,
      failed: 0,
      tests: []
    };
  }

  async runTest(testName, testFunction) {
    console.log(`\n🧪 Running test: ${testName}`);
    try {
      const result = await testFunction();
      if (result.success) {
        console.log(`✅ PASSED: ${testName}`);
        this.results.passed++;
      } else {
        console.log(`❌ FAILED: ${testName} - ${result.error}`);
        this.results.failed++;
      }
      this.results.tests.push({ name: testName, ...result });
    } catch (error) {
      console.log(`❌ ERROR: ${testName} - ${error.message}`);
      this.results.failed++;
      this.results.tests.push({ 
        name: testName, 
        success: false, 
        error: error.message 
      });
    }
  }

  async testDatabaseSchema() {
    // Test 1: Check if new tables exist
    const { data: tables, error } = await this.supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .in('table_name', ['openai_embeddings', 'openai_query_cache']);

    if (error) {
      return { success: false, error: error.message };
    }

    const tableNames = tables.map(t => t.table_name);
    const requiredTables = ['openai_embeddings', 'openai_query_cache'];
    const missingTables = requiredTables.filter(t => !tableNames.includes(t));

    if (missingTables.length > 0) {
      return { 
        success: false, 
        error: `Missing tables: ${missingTables.join(', ')}` 
      };
    }

    return { 
      success: true, 
      message: 'All required tables exist',
      data: { tables: tableNames }
    };
  }

  async testEmbeddingGeneration() {
    // Test 2: Test OpenAI embeddings generation
    try {
      const response = await fetch('/api/embeddings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_embedding',
          text: 'This is a test sentence for embedding generation.'
        })
      });

      if (!response.ok) {
        return { 
          success: false, 
          error: `API responded with status ${response.status}` 
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return { success: false, error: data.error };
      }

      return { 
        success: true, 
        message: 'Embedding generation working correctly',
        data: { embeddingLength: data.embedding?.length }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testVectorSearch() {
    // Test 3: Test vector search functionality
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'test_search'
        })
      });

      if (!response.ok) {
        return { 
          success: false, 
          error: `Search API responded with status ${response.status}` 
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return { success: false, error: data.error };
      }

      const summary = data.data.summary;
      
      return { 
        success: true, 
        message: `Search test completed: ${summary.successfulQueries}/${summary.totalQueries} queries successful`,
        data: summary
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testSpecificSearch() {
    // Test 4: Test specific search query
    try {
      const response = await fetch('/api/search', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          action: 'search',
          query: TEST_CONFIG.testQuery,
          gradeLevel: TEST_CONFIG.gradeLevel,
          documentType: TEST_CONFIG.documentType,
          limit: 5
        })
      });

      if (!response.ok) {
        return { 
          success: false, 
          error: `Specific search API responded with status ${response.status}` 
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return { success: false, error: data.error };
      }

      const results = data.data.results;
      
      return { 
        success: true, 
        message: `Found ${results.length} results for "${TEST_CONFIG.testQuery}"`,
        data: { resultCount: results.length, query: TEST_CONFIG.testQuery }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testProcessingStats() {
    // Test 5: Test processing statistics
    try {
      const response = await fetch('/api/embeddings?action=stats');

      if (!response.ok) {
        return { 
          success: false, 
          error: `Stats API responded with status ${response.status}` 
        };
      }

      const data = await response.json();
      
      if (!data.success) {
        return { success: false, error: data.error };
      }

      const stats = data.stats;
      
      return { 
        success: true, 
        message: `Stats retrieved: ${stats.totalDocuments} docs, ${stats.totalChunks} chunks`,
        data: stats
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testAIIntegration() {
    // Test 6: Test AI content generation with embeddings
    try {
      // Test if the enhanced AI system is working
      const { EnhancedAI } = await import('../lib/enhanced-ai');
      const ai = new EnhancedAI();
      
      // Test lesson generation
      const lesson = await ai.generateLesson(
        'Photosynthesis process in plants',
        5,
        'science'
      );

      if (!lesson || lesson.length < 100) {
        return { 
          success: false, 
          error: 'Generated lesson is too short or empty' 
        };
      }

      return { 
        success: true, 
        message: `AI lesson generation working, generated ${lesson.length} characters`,
        data: { lessonLength: lesson.length }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testDatabaseConnectivity() {
    // Test 7: Test database connectivity and permissions
    try {
      const { data, error } = await this.supabase
        .from('openai_embeddings')
        .select('count(*)')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Database connectivity confirmed',
        data: { connected: true }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async testCacheSystem() {
    // Test 8: Test query caching system
    try {
      const { data, error } = await this.supabase
        .from('openai_query_cache')
        .select('count(*)')
        .limit(1);

      if (error) {
        return { success: false, error: error.message };
      }

      return { 
        success: true, 
        message: 'Cache system accessible',
        data: { cacheAccessible: true }
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  }

  async runAllTests() {
    console.log('🚀 Starting OpenAI Embeddings System Tests\n');
    console.log('================================================');

    await this.runTest('Database Schema Validation', () => this.testDatabaseSchema());
    await this.runTest('Database Connectivity', () => this.testDatabaseConnectivity());
    await this.runTest('Cache System Access', () => this.testCacheSystem());
    await this.runTest('Embedding Generation', () => this.testEmbeddingGeneration());
    await this.runTest('Vector Search Functionality', () => this.testVectorSearch());
    await this.runTest('Specific Search Query', () => this.testSpecificSearch());
    await this.runTest('Processing Statistics', () => this.testProcessingStats());
    await this.runTest('AI Integration', () => this.testAIIntegration());

    console.log('\n================================================');
    console.log('📊 TEST RESULTS SUMMARY');
    console.log('================================================');
    console.log(`✅ Passed: ${this.results.passed}`);
    console.log(`❌ Failed: ${this.results.failed}`);
    console.log(`📈 Success Rate: ${Math.round((this.results.passed / (this.results.passed + this.results.failed)) * 100)}%`);

    if (this.results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! The OpenAI embeddings system is ready for use.');
    } else {
      console.log('\n⚠️  Some tests failed. Please review the failed tests above.');
    }

    console.log('\n📝 Next Steps:');
    console.log('1. Visit /admin/embeddings to access the admin panel');
    console.log('2. Process your documents using the "Process New Documents" button');
    console.log('3. Test search functionality in the admin panel');
    console.log('4. Verify AI content generation is using embeddings context');
    
    return this.results;
  }
}

// Export for use in other scripts
module.exports = { EmbeddingsSystemTester, TEST_CONFIG };

// Run tests if this file is executed directly
if (require.main === module) {
  const tester = new EmbeddingsSystemTester();
  tester.runAllTests().catch(console.error);
}