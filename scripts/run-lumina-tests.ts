#!/usr/bin/env ts-node

// Main script to execute LUMINA platform tests

import { config } from 'dotenv';
import { resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { TestOrchestrator } from '../lib/core/TestOrchestrator';
import { LuminaBetaUserAgent } from '../lib/agents/lumina/BetaUserAgent';
import { ReportGenerator } from '../lib/monitoring/ReportGenerator';
import { TestConfig } from '../lib/core/types';
import { format } from 'date-fns';

// Load environment variables
config();

interface CliOptions {
  parallel?: boolean;
  stress?: boolean;
  agents?: number;
  concurrent?: number;
}

/**
 * Parse command line arguments
 */
function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};

  if (args.includes('--parallel')) {
    options.parallel = true;
  }

  if (args.includes('--stress')) {
    options.stress = true;
  }

  const agentsIndex = args.indexOf('--agents');
  if (agentsIndex !== -1 && args[agentsIndex + 1]) {
    options.agents = parseInt(args[agentsIndex + 1]);
  }

  const concurrentIndex = args.indexOf('--concurrent');
  if (concurrentIndex !== -1 && args[concurrentIndex + 1]) {
    options.concurrent = parseInt(args[concurrentIndex + 1]);
  }

  return options;
}

/**
 * Main execution function
 */
async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   AGENTIC TEST PLATFORM - LUMINA Marketing Platform      ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  // Parse CLI options
  const cliOptions = parseArgs();

  // Determine test configuration
  let testType: 'parallel' | 'serial' | 'stress';
  let agentCount: number;
  let maxConcurrent: number;

  if (cliOptions.stress) {
    testType = 'stress';
    agentCount = cliOptions.agents || 50;
    maxConcurrent = cliOptions.concurrent || 10;
  } else if (cliOptions.parallel) {
    testType = 'parallel';
    agentCount = cliOptions.agents || 20;
    maxConcurrent = cliOptions.concurrent || 5;
  } else {
    testType = 'serial';
    agentCount = cliOptions.agents || 10;
    maxConcurrent = 1;
  }

  console.log('Test Configuration:');
  console.log(`  Type: ${testType.toUpperCase()}`);
  console.log(`  Agents: ${agentCount}`);
  console.log(`  Max Concurrent: ${maxConcurrent}`);
  console.log(`  Platform: LUMINA Marketing\n`);

  // Validate environment variables
  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not set in environment');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY not set in environment');
    process.exit(1);
  }

  const luminaBaseUrl = process.env.LUMINA_BASE_URL || 'http://localhost:3000';
  console.log(`  Target URL: ${luminaBaseUrl}\n`);

  // Ensure test-results directory exists
  const resultsDir = resolve(__dirname, '../test-results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  // Create test configuration
  const testConfig: TestConfig = {
    platform: 'lumina',
    baseUrl: luminaBaseUrl,
    apiKey: process.env.LUMINA_API_KEY,
    timeout: parseInt(process.env.TEST_TIMEOUT_MS || '30000'),
    maxRetries: 3,
    parallelAgents: maxConcurrent,
    enableDetailedLogging: process.env.ENABLE_DETAILED_LOGGING === 'true',
  };

  // Create orchestrator
  const orchestrator = new TestOrchestrator();

  console.log('🚀 Starting test execution...\n');
  const startTime = Date.now();

  try {
    // Execute test
    const result = await orchestrator.executeTest(
      {
        platform: 'lumina',
        testType,
        agentCount,
        maxConcurrent,
        config: testConfig,
      },
      LuminaBetaUserAgent
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    TEST COMPLETED                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\n');

    console.log('Results Summary:');
    console.log(`  Test Run ID: ${result.testRunId}`);
    console.log(`  Total Agents: ${result.totalAgents}`);
    console.log(`  ✅ Completed: ${result.completedAgents}`);
    console.log(`  ❌ Failed: ${result.failedAgents}`);
    console.log(`  Success Rate: ${result.successRate.toFixed(2)}%`);
    console.log(`  Duration: ${duration}s\n`);

    // Generate report
    console.log('📊 Generating comprehensive report...');
    const reportGenerator = new ReportGenerator();

    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const reportPath = resolve(resultsDir, `lumina-test-report-${timestamp}.md`);

    await reportGenerator.generateReport({
      testRunId: result.testRunId,
      outputPath: reportPath,
      format: 'markdown',
    });

    console.log(`✅ Report saved to: ${reportPath}\n`);

    // Display status emoji based on success rate
    if (result.successRate >= 95) {
      console.log('🎉 EXCELLENT! All tests passed with high success rate.');
    } else if (result.successRate >= 80) {
      console.log('✅ GOOD! Most tests passed, but some issues need attention.');
    } else if (result.successRate >= 60) {
      console.log('⚠️  WARNING! Significant issues detected. Review errors before beta.');
    } else {
      console.log('❌ CRITICAL! Platform not ready for beta. Major issues found.');
    }

    // Cleanup
    await orchestrator.cleanup();
    await reportGenerator.cleanup();

    // Exit with appropriate code
    process.exit(result.successRate >= 80 ? 0 : 1);
  } catch (error: any) {
    console.error('\n❌ TEST EXECUTION FAILED');
    console.error(`Error: ${error.message}`);
    console.error(error.stack);

    await orchestrator.cleanup();
    process.exit(1);
  }
}

// Handle uncaught errors
process.on('unhandledRejection', (error: any) => {
  console.error('\n❌ UNHANDLED REJECTION');
  console.error(error);
  process.exit(1);
});

process.on('uncaughtException', (error: any) => {
  console.error('\n❌ UNCAUGHT EXCEPTION');
  console.error(error);
  process.exit(1);
});

// Run main function
main();
