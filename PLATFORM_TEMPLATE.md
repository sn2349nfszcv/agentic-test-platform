# Platform Template - Add New APEXDEV Platform Support

This guide provides a complete template for adding support for a new APEXDEV platform to the Agentic Test Platform.

---

## Quick Start Checklist

- [ ] Create agent directory: `lib/agents/{platform-name}/`
- [ ] Create agent class: `BetaUserAgent.ts`
- [ ] Create execution script: `scripts/run-{platform}-tests.ts`
- [ ] Create scenarios directory: `scenarios/{platform-name}/`
- [ ] Update `package.json` with new scripts
- [ ] Update `.env.example` with platform URL
- [ ] Test the implementation
- [ ] Update documentation

**Estimated Time:** 2-3 hours

---

## Step 1: Create Agent Directory

```bash
mkdir -p lib/agents/{platform-name}
mkdir -p scenarios/{platform-name}
```

Replace `{platform-name}` with your platform name (lowercase, hyphenated).

Examples:
- `lib/agents/veritask-forensic/`
- `lib/agents/mednext-healthcare/`
- `lib/agents/keystone-governance/`

---

## Step 2: Create Agent Class

Create `lib/agents/{platform-name}/BetaUserAgent.ts`:

```typescript
// {PlatformName} Beta User Agent - Simulates real user behavior

import { TestAgent } from '../../core/TestAgent';
import {
  UserPersona,
  TestConfig,
  TestResult,
  TestStatus,
} from '../../core/types';

// Define platform-specific interfaces
interface {PlatformName}User {
  id: string;
  email: string;
  name: string;
  // Add platform-specific fields
}

interface {PlatformName}Resource {
  id: string;
  // Add platform-specific resource fields
}

export class {PlatformName}BetaUserAgent extends TestAgent {
  private sessionCookie?: string;
  private user?: {PlatformName}User;
  private resources: {PlatformName}Resource[] = [];

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    super(agentName, persona, config);
    this.metrics.stepsTotal = 10; // Adjust based on your test flow
  }

  /**
   * Execute complete {PlatformName} test flow
   */
  async executeTestFlow(): Promise<TestResult> {
    this.logger.info('Starting {PlatformName} test flow');
    this.status = TestStatus.RUNNING;

    try {
      // Step 1: Sign up / Authentication
      await this.executeAction(
        'signup_or_login',
        async () => await this.signupOrLogin(),
        true
      );
      await this.humanDelay();

      // Step 2: Your platform-specific action
      await this.executeAction(
        'create_resource',
        async () => await this.createResource(),
        true
      );
      await this.humanDelay();

      // Step 3-10: Add your platform's key actions
      // ...

      return this.generateResult(
        TestStatus.COMPLETED,
        `Successfully completed {PlatformName} test flow`
      );
    } catch (error: any) {
      this.logger.error('Test flow failed', { error: error.message });
      return this.generateResult(
        TestStatus.FAILED,
        `Test flow failed: ${error.message}`
      );
    }
  }

  /**
   * Generate realistic content based on persona and content type
   */
  async generateRealisticContent(contentType: string): Promise<any> {
    const prompt = `Generate realistic ${contentType} for a ${this.persona.type} level user testing {PlatformName}.

Persona characteristics:
- Tech Savvy: ${this.persona.characteristics.techSavvy}/10
- Detail Oriented: ${this.persona.characteristics.detailOriented}/10

Generate content that this persona would realistically create.`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      return content.type === 'text' ? content.text : '';
    } catch (error: any) {
      this.logger.error('Failed to generate realistic content', {
        contentType,
        error: error.message,
      });
      return this.getFallbackContent(contentType);
    }
  }

  /**
   * Sign up or log in
   */
  private async signupOrLogin(): Promise<void> {
    const email = `${this.agentName.toLowerCase()}@test-{platform}.local`;
    const password = 'TestUser123!'; // pragma: allowlist secret

    this.logger.info('Attempting signup/login', { email });

    try {
      const signupResponse = await this.http.post('/api/auth/signup', {
        email,
        password,
        name: this.persona.name,
      });

      this.user = signupResponse.data.user;
      this.sessionCookie = signupResponse.headers['set-cookie']?.[0];
      this.logger.info('Signup successful', { userId: this.user!.id });
    } catch (error: any) {
      if (error.response?.status === 409) {
        const loginResponse = await this.http.post('/api/auth/signin', {
          email,
          password,
        });

        this.user = loginResponse.data.user;
        this.sessionCookie = loginResponse.headers['set-cookie']?.[0];
        this.logger.info('Login successful', { userId: this.user!.id });
      } else {
        throw error;
      }
    }

    if (this.sessionCookie) {
      this.http.defaults.headers.Cookie = this.sessionCookie;
    }
  }

  /**
   * Create a resource (example platform action)
   */
  private async createResource(): Promise<void> {
    this.logger.info('Creating resource');

    // Generate realistic resource data
    const resourceData = await this.generateRealisticContent('resource_data');

    const response = await this.http.post('/api/resources', {
      name: `Test Resource - ${this.agentName}`,
      data: resourceData,
    });

    this.resources.push(response.data.resource);
    this.logger.info('Resource created', { resourceId: response.data.resource.id });
  }

  /**
   * Add more platform-specific methods here
   */
  // private async yourMethod(): Promise<void> { }

  /**
   * Get fallback content when Claude API fails
   */
  private getFallbackContent(contentType: string): string {
    const fallbacks: Record<string, string> = {
      resource_data: 'Generated test content',
      // Add more fallback content
    };

    return fallbacks[contentType] || 'Generated test content';
  }
}
```

**Key Points:**
1. **Define interfaces** for your platform's data types
2. **Set stepsTotal** to match your test flow length
3. **Implement executeTestFlow()** with your platform's key actions
4. **Add human delays** between actions for realistic simulation
5. **Use makeIntelligentDecision()** when users need to make choices
6. **Generate realistic content** using Claude for dynamic testing

---

## Step 3: Create Execution Script

Create `scripts/run-{platform}-tests.ts`:

```typescript
#!/usr/bin/env ts-node

// {PlatformName} platform test execution script

import { config } from 'dotenv';
import { resolve } from 'path';
import { mkdirSync, existsSync } from 'fs';
import { TestOrchestrator } from '../lib/core/TestOrchestrator';
import { {PlatformName}BetaUserAgent } from '../lib/agents/{platform-name}/BetaUserAgent';
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
  console.log('║   AGENTIC TEST PLATFORM - {PlatformName}                 ║');
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
  console.log(`  Platform: {PlatformName}\n`);

  if (!process.env.DATABASE_URL) {
    console.error('❌ ERROR: DATABASE_URL not set');
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error('❌ ERROR: ANTHROPIC_API_KEY not set');
    process.exit(1);
  }

  const baseUrl = process.env.{PLATFORM}_BASE_URL || 'http://localhost:3000';
  console.log(`  Target URL: ${baseUrl}\n`);

  const resultsDir = resolve(__dirname, '../test-results');
  if (!existsSync(resultsDir)) {
    mkdirSync(resultsDir, { recursive: true });
  }

  const testConfig: TestConfig = {
    platform: '{platform-name}',
    baseUrl,
    apiKey: process.env.{PLATFORM}_API_KEY,
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
        platform: '{platform-name}',
        testType,
        agentCount,
        maxConcurrent,
        config: testConfig,
      },
      {PlatformName}BetaUserAgent
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
    const reportPath = resolve(resultsDir, `{platform}-test-report-${timestamp}.md`);

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
```

---

## Step 4: Update Configuration Files

### Update `package.json`:

```json
{
  "scripts": {
    "test:{platform}": "ts-node scripts/run-{platform}-tests.ts",
    "test:{platform}:parallel": "ts-node scripts/run-{platform}-tests.ts --parallel",
    "test:{platform}:stress": "ts-node scripts/run-{platform}-tests.ts --stress"
  }
}
```

### Update `.env.example`:

```env
# {PlatformName} Configuration
{PLATFORM}_BASE_URL=http://localhost:3000
{PLATFORM}_API_KEY=optional-if-needed
```

---

## Step 5: Create Test Scenarios (Optional)

Create `scenarios/{platform-name}/basic-flow.ts`:

```typescript
import { TestScenario } from '../../lib/core/types';

export const basicFlowScenario: TestScenario = {
  id: '{platform}-basic-flow',
  name: 'Basic {PlatformName} Flow',
  description: 'Tests core functionality',
  steps: [
    {
      id: 'signup',
      name: 'User Registration',
      description: 'Create new account',
      action: async () => { /* implementation */ },
    },
    // Add more steps
  ],
  expectedDuration: 60000, // 60 seconds
  priority: 1,
  tags: ['authentication', 'core'],
};
```

---

## Step 6: Test Your Implementation

### 1. Build TypeScript:

```bash
npm run build
```

### 2. Run small test:

```bash
npm run test:{platform} -- --agents 2
```

### 3. Check for errors:

- Review logs in `test-results/`
- Fix any TypeScript errors
- Verify API endpoints match your platform

### 4. Run full test:

```bash
npm run test:{platform}:parallel
```

---

## Step 7: Document Your Platform

Create `scenarios/{platform-name}/README.md`:

```markdown
# {PlatformName} Test Agent

## Overview

Brief description of what this platform does.

## Test Flow

1. **Sign up / Login**
2. **Action 1**: Description
3. **Action 2**: Description
...

## Expected Results

- Success rate: >90%
- Average duration: ~5 minutes per agent
- Common errors: None expected

## Platform-Specific Notes

- Special configuration needed
- Known limitations
- API quirks to watch out for
```

---

## Best Practices

### 1. **Realistic Timing**

Always add human delays:

```typescript
await this.humanDelay(); // Adjusts based on persona
```

### 2. **Intelligent Decisions**

Use Claude for realistic choices:

```typescript
const decision = await this.makeIntelligentDecision(
  'What would you like to do next?',
  ['Option A', 'Option B', 'Option C']
);
```

### 3. **Error Handling**

Always handle errors gracefully:

```typescript
try {
  await this.executeAction('action_name', async () => {
    // Your action
  }, true); // true = retryable
} catch (error) {
  this.logger.error('Action failed', { error });
}
```

### 4. **Persona-Based Behavior**

Adapt behavior to persona:

```typescript
private shouldUseAdvancedFeature(): boolean {
  if (this.persona.type === 'EXPERT') return true;
  if (this.persona.type === 'INTERMEDIATE') return Math.random() > 0.5;
  return false;
}
```

### 5. **Comprehensive Logging**

Log all significant actions:

```typescript
this.logger.info('Action completed', {
  resourceId: resource.id,
  duration: `${duration}ms`,
});
```

---

## Common Pitfalls

### ❌ Don't:

- Skip human delays (makes timing unrealistic)
- Hardcode decisions (use `makeIntelligentDecision()`)
- Ignore persona characteristics
- Create too many agents initially (start with 2-3)
- Forget to update `stepsTotal`

### ✅ Do:

- Use realistic content generation
- Handle all expected errors
- Test with different persona types
- Monitor logs during development
- Start small, scale gradually

---

## Testing Checklist

- [ ] Agent compiles without errors
- [ ] Test runs with 2 agents successfully
- [ ] All steps execute in correct order
- [ ] Human delays are appropriate
- [ ] Decisions use Claude API
- [ ] Errors are logged properly
- [ ] Success rate > 80%
- [ ] Report generates correctly
- [ ] Documentation is complete

---

## Example Platforms

For reference implementations, see:

- **LUMINA**: `lib/agents/lumina/BetaUserAgent.ts`
- **ReadWorthy**: `lib/agents/readworthy/BetaUserAgent.ts`
- **Scholarly-AI**: `lib/agents/scholarly/BetaUserAgent.ts`

---

## Need Help?

1. Check existing agent implementations
2. Review `ARCHITECTURE.md` for design patterns
3. Test with verbose logging: `ENABLE_DETAILED_LOGGING=true`
4. Start with minimal implementation, add complexity gradually

---

**Ready to add your platform? Follow the checklist above and you'll have a working agent in 2-3 hours!**
