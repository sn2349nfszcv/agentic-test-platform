// Script generator for new platform execution scripts

import { writeFileSync } from 'fs';
import { resolve } from 'path';

const platforms = [
  { name: 'veritask-forensic', displayName: 'Veritask-Forensic', agentClass: 'VeritaskForensicBetaUserAgent', envPrefix: 'VERITASK' },
  { name: 'mednext-healthcare', displayName: 'MedNext-Healthcare', agentClass: 'MedNextHealthcareBetaUserAgent', envPrefix: 'MEDNEXT' },
  { name: 'keystone-governance', displayName: 'Keystone-Governance', agentClass: 'KeystoneGovernanceBetaUserAgent', envPrefix: 'KEYSTONE' },
  { name: 'ahpra-pro', displayName: 'AHPRA-Pro', agentClass: 'AHPRAProBetaUserAgent', envPrefix: 'AHPRA' },
  { name: 'businessadvisor-ai', displayName: 'BusinessAdvisor-AI', agentClass: 'BusinessAdvisorAIBetaUserAgent', envPrefix: 'BUSINESSADVISOR' },
  { name: 'iconic-ai', displayName: 'Iconic-AI', agentClass: 'IconicAIBetaUserAgent', envPrefix: 'ICONIC' },
  { name: 'securelink-remote', displayName: 'SecureLink-Remote', agentClass: 'SecureLinkRemoteBetaUserAgent', envPrefix: 'SECURELINK' },
];

function generateScript(platform: typeof platforms[0]): string {
  return `#!/usr/bin/env ts-node

// ${platform.displayName} platform test execution script

import { config } from 'dotenv';
import { resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { TestOrchestrator } from '../lib/core/TestOrchestrator';
import { ${platform.agentClass} } from '../lib/agents/${platform.name}/BetaUserAgent';
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
  console.log('║   AGENTIC TEST PLATFORM - ${platform.displayName.padEnd(29)} ║');
  console.log('╚═══════════════════════════════════════════════════════════╝\\n');

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
  console.log(\`  Type: \${testType.toUpperCase()}\`);
  console.log(\`  Agents: \${agentCount}\`);
  console.log(\`  Max Concurrent: \${maxConcurrent}\`);
  console.log(\`  Platform: ${platform.displayName}\\n\`);

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not set');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const baseUrl = process.env.${platform.envPrefix}_BASE_URL || 'http://localhost:3000';
  console.log(\`  Target URL: \${baseUrl}\\n\`);

  const resultsDir = resolve(__dirname, '../test-results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  const testConfig: TestConfig = {
    platform: '${platform.name}',
    baseUrl,
    apiKey: process.env.${platform.envPrefix}_API_KEY,
    timeout: parseInt(process.env.TEST_TIMEOUT_MS || '30000'),
    maxRetries: 3,
    parallelAgents: maxConcurrent,
    enableDetailedLogging: process.env.ENABLE_DETAILED_LOGGING === 'true',
  };

  const orchestrator = new TestOrchestrator();
  console.log('🚀 Starting test execution...\\n');
  const startTime = Date.now();

  try {
    const result = await orchestrator.executeTest(
      {
        platform: '${platform.name}',
        testType,
        agentCount,
        maxConcurrent,
        config: testConfig,
      },
      ${platform.agentClass}
    );

    const duration = ((Date.now() - startTime) / 1000).toFixed(2);

    console.log('\\n╔═══════════════════════════════════════════════════════════╗');
    console.log('║                    TEST COMPLETED                          ║');
    console.log('╚═══════════════════════════════════════════════════════════╝\\n');

    console.log('Results Summary:');
    console.log(\`  Test Run ID: \${result.testRunId}\`);
    console.log(\`  Total Agents: \${result.totalAgents}\`);
    console.log(\`  ✅ Completed: \${result.completedAgents}\`);
    console.log(\`  ❌ Failed: \${result.failedAgents}\`);
    console.log(\`  Success Rate: \${result.successRate.toFixed(2)}%\`);
    console.log(\`  Duration: \${duration}s\\n\`);

    console.log('📊 Generating comprehensive report...');
    const reportGenerator = new ReportGenerator();

    const timestamp = format(new Date(), 'yyyy-MM-dd-HH-mm-ss');
    const reportPath = resolve(resultsDir, \`${platform.name}-test-report-\${timestamp}.md\`);

    await reportGenerator.generateReport({
      testRunId: result.testRunId,
      outputPath: reportPath,
      format: 'markdown',
    });

    console.log(\`✅ Report saved to: \${reportPath}\\n\`);

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
    console.error('\\n❌ TEST EXECUTION FAILED');
    console.error(\`Error: \${error.message}\`);
    await orchestrator.cleanup();
    process.exit(1);
  }
}

process.on('unhandledRejection', (error: any) => {
  console.error('\\n❌ UNHANDLED REJECTION');
  console.error(error);
  process.exit(1);
});

main();
`;
}

console.log('Generating execution scripts for all platforms...\n');

platforms.forEach(platform => {
  const scriptPath = resolve(__dirname, `run-${platform.name}-tests.ts`);
  const scriptContent = generateScript(platform);
  writeFileSync(scriptPath, scriptContent, 'utf-8');
  console.log(`✅ Created: ${scriptPath}`);
});

console.log('\n🎉 All execution scripts generated successfully!');
