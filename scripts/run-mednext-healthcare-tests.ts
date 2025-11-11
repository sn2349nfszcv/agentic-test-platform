#!/usr/bin/env ts-node

// MedNext-Healthcare platform test execution script

import { config } from 'dotenv';
import { resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { TestOrchestrator } from '../lib/core/TestOrchestrator';
import { MedNextHealthcareBetaUserAgent } from '../lib/agents/mednext-healthcare/BetaUserAgent';
import { ReportGenerator } from '../lib/monitoring/ReportGenerator';
import { TestConfig } from '../lib/core/types';
import { format } from 'date-fns';

config();

interface CliOptions {
  parallel?: boolean;
  stress?: boolean;
  agents?: number;
  concurrent?: number;
}

function parseArgs(): CliOptions {
  const args = process.argv.slice(2);
  const options: CliOptions = {};
  if (args.includes('--parallel')) options.parallel = true;
  if (args.includes('--stress')) options.stress = true;
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

async function main() {
  console.log('╔═══════════════════════════════════════════════════════════╗');
  console.log('║   AGENTIC TEST PLATFORM - MedNext-Healthcare            ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\n');

  const cliOptions = parseArgs();
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
  console.log(`  Platform: MedNext-Healthcare\n`);

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not set');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const baseUrl = process.env.MEDNEXT_BASE_URL || 'http://localhost:3000';
  console.log(`  Target URL: ${baseUrl}\n`);

  const resultsDir = resolve(__dirname, '../test-results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  const testConfig: TestConfig = {
    platform: 'mednext-healthcare',
    baseUrl,
    apiKey: process.env.MEDNEXT_API_KEY,
    timeout: parseInt(process.env.TEST_TIMEOUT_MS || '30000'),
    maxRetries: 3,
    parallelAgents: maxConcurrent,
    enableDetailedLogging: process.env.ENABLE_DETAILED_LOGGING === 'true',
  };

  const orchestrator = new TestOrchestrator();
  console.log('🚀 Starting test execution...\n');
  const startTime = Date.now();

  try {
    const result = await orchestrator.executeTest(
      {
        platform: 'mednext-healthcare',
        testType,
        agentCount,
        maxConcurrent,
        config: testConfig,
      },
      MedNextHealthcareBetaUserAgent
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

    console.log('📊 Generating comprehensive report...');
    const reportGenerator = new ReportGenerator();

    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const reportPath = resolve(resultsDir, `mednext-healthcare-test-report-${timestamp}.md`);

    await reportGenerator.generateReport({
      testRunId: result.testRunId,
      outputPath: reportPath,
      format: 'markdown',
    });

    console.log(`✅ Report saved to: ${reportPath}\n`);

    if (result.successRate >= 95) {
      console.log('🎉 EXCELLENT! All tests passed.');
    } else if (result.successRate >= 80) {
      console.log('✅ GOOD! Most tests passed.');
    } else {
      console.log('⚠️  WARNING! Significant issues detected.');
    }

    await orchestrator.cleanup();
    await reportGenerator.cleanup();

    process.exit(result.successRate >= 80 ? 0 : 1);
  } catch (error: any) {
    console.error('\n❌ TEST EXECUTION FAILED');
    console.error(`Error: ${error.message}`);
    await orchestrator.cleanup();
    process.exit(1);
  }
}

process.on('unhandledRejection', (error: any) => {
  console.error('\n❌ UNHANDLED REJECTION');
  console.error(error);
  process.exit(1);
});

main();
