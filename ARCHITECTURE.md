# Agentic Test Platform - Architecture

## System Overview

The Agentic Test Platform is a sophisticated AI-powered testing system designed to simulate realistic user behavior at scale. It uses Claude 3.5 Sonnet to power intelligent test agents that make decisions based on user personas.

## High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                     Agentic Test Platform                        │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐         ┌────────────────┐                 │
│  │ Test           │────────▶│ Test Agent     │                 │
│  │ Orchestrator   │         │ (Base Class)   │                 │
│  └────────────────┘         └────────────────┘                 │
│         │                            │                           │
│         │                            │                           │
│         ▼                            ▼                           │
│  ┌────────────────┐         ┌────────────────┐                 │
│  │ Queue Manager  │         │ Platform-       │                 │
│  │ (p-queue)      │         │ Specific Agent  │                 │
│  └────────────────┘         │ (LUMINA, etc.) │                 │
│         │                   └────────────────┘                 │
│         │                            │                           │
│         └────────────────────────────┘                           │
│                    │                                             │
│                    ▼                                             │
│         ┌────────────────────┐                                  │
│         │ Anthropic Claude   │                                  │
│         │ (Decision Engine)  │                                  │
│         └────────────────────┘                                  │
│                    │                                             │
│                    ▼                                             │
│         ┌────────────────────┐       ┌────────────────┐        │
│         │ Target Platform    │◀─────▶│ PostgreSQL     │        │
│         │ (LUMINA, etc.)     │       │ (Test Results) │        │
│         └────────────────────┘       └────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## Core Components

### 1. Test Orchestrator

**Purpose**: Manages parallel execution of multiple test agents.

**Key Responsibilities:**
- Create and initialize test agents
- Manage execution queue (serial vs parallel)
- Coordinate wave-based batching
- Aggregate results
- Store metrics in database
- Generate summary reports

**Implementation:**
```typescript
class TestOrchestrator {
  private queue: PQueue;
  private prisma: PrismaClient;

  async executeTest(config, AgentClass) {
    // Create test run record
    // Generate personas
    // Create and queue agents
    // Execute based on test type (serial/parallel)
    // Aggregate results
    // Update database
  }
}
```

**Key Features:**
- Queue concurrency control
- Error isolation (one agent failure doesn't affect others)
- Real-time progress tracking
- Database persistence

### 2. Test Agent (Base Class)

**Purpose**: Abstract base class for all platform-specific test agents.

**Key Responsibilities:**
- Initialize HTTP client and Claude API client
- Execute actions with timing/error tracking
- Make intelligent decisions via Claude
- Log all activities
- Generate test results

**Implementation:**
```typescript
abstract class TestAgent {
  protected anthropic: Anthropic;
  protected http: AxiosInstance;
  protected persona: UserPersona;
  protected metrics: TestMetrics;

  abstract async executeTestFlow(): Promise<TestResult>;
  abstract async generateRealisticContent(type): Promise<any>;

  protected async makeIntelligentDecision(context, options);
  protected async executeAction(actionType, actionFn, retryable);
  protected async humanDelay();
}
```

**Key Features:**
- Persona-based behavior
- Intelligent decision making
- Action tracking and metrics
- Realistic timing delays
- Error handling and retry logic

### 3. Platform-Specific Agents

**Purpose**: Implement complete test flows for specific platforms.

**Example: LuminaBetaUserAgent**

```typescript
class LuminaBetaUserAgent extends TestAgent {
  async executeTestFlow() {
    // 1. Sign up / Login
    await this.executeAction('signup', ...);

    // 2. Upload manuscript
    await this.executeAction('upload_manuscript', ...);

    // 3. Extract quotes
    await this.executeAction('extract_quotes', ...);

    // 4-12. Continue with other steps

    return this.generateResult(...);
  }
}
```

**Key Features:**
- Complete user flow simulation
- Realistic content generation
- Persona-specific behavior
- Decision making at key points

### 4. Persona Generator

**Purpose**: Create realistic user personas with distinct characteristics.

**Implementation:**
```typescript
class PersonaGenerator {
  static generate(type: PersonaType, index: number): UserPersona {
    return {
      id: `persona_${type}_${index}`,
      name: `${template.namePrefix} ${index}`,
      type,
      characteristics: { techSavvy, patience, riskTolerance, ... },
      goals: [...],
      painPoints: [...],
      decisionPatterns: { explorationVsEfficiency, ... }
    };
  }
}
```

**Persona Types:**
- **BEGINNER** (30%): Low tech savvy, exploratory, seeks help
- **INTERMEDIATE** (40%): Moderate tech savvy, balanced approach
- **EXPERT** (20%): High tech savvy, efficient, early adopter
- **POWER_USER** (10%): Very high tech savvy, uses advanced features

### 5. Report Generator

**Purpose**: Generate comprehensive test reports in multiple formats.

**Capabilities:**
- Markdown reports
- JSON exports
- HTML reports
- Statistical analysis
- Error categorization
- Performance metrics
- Actionable recommendations

**Report Sections:**
1. Executive Summary
2. Agent Results Table
3. Error Analysis
4. Performance Metrics
5. Persona Distribution
6. Top Errors
7. Recommendations

### 6. Database Layer (Prisma)

**Purpose**: Store and query test results for historical analysis.

**Schema:**

```
TestRun (parent)
├── TestAgent[] (many agents per run)
├── TestMetric[] (performance data)
└── TestError[] (error logs)

TestScenario (reusable test flows)
TestPersona (persona definitions)
```

**Key Tables:**
- **TestRun**: Overall test execution metadata
- **TestAgent**: Individual agent results and metrics
- **TestMetric**: Time-series performance data
- **TestError**: Detailed error logs
- **TestScenario**: Reusable test scenarios
- **TestPersona**: Persona templates

## Data Flow

### Test Execution Flow

```
1. User runs: npm run test:lumina:parallel --agents 20

2. CLI parses arguments → config = { agentCount: 20, maxConcurrent: 5 }

3. TestOrchestrator.executeTest(config, LuminaBetaUserAgent)
   │
   ├─ Create TestRun record in database
   ├─ Generate 20 personas (6 BEGINNER, 8 INT, 4 EXP, 2 POWER)
   ├─ Instantiate 20 LuminaBetaUserAgent instances
   ├─ Create TestAgent records in database
   └─ Add all agents to queue (concurrency: 5)

4. Queue executes agents in waves:
   Wave 1: Agents 1-5  (parallel)
   Wave 2: Agents 6-10 (parallel)
   Wave 3: Agents 11-15 (parallel)
   Wave 4: Agents 16-20 (parallel)

5. Each agent:
   │
   ├─ Initialize HTTP client + Claude client
   ├─ Execute complete user flow (12 steps)
   │  ├─ Step 1: Sign up
   │  │   ├─ Make HTTP request
   │  │   ├─ Track timing
   │  │   └─ Log result
   │  ├─ Human delay (2-3 seconds based on persona)
   │  ├─ Step 2: Upload manuscript
   │  │   ├─ Ask Claude to generate realistic content
   │  │   ├─ Make HTTP request
   │  │   └─ Track result
   │  ├─ ... (continue with remaining steps)
   │  └─ Decision points (use Claude for realistic choices)
   │
   └─ Return TestResult with metrics

6. Orchestrator aggregates results:
   ├─ Calculate success rate
   ├─ Calculate avg response time
   ├─ Calculate throughput
   ├─ Update TestRun record
   └─ Update all TestAgent records

7. ReportGenerator creates markdown report:
   ├─ Query database for TestRun + related data
   ├─ Calculate statistics
   ├─ Categorize errors
   ├─ Generate recommendations
   └─ Save to file

8. CLI displays summary and exits
```

### Decision Making Flow

```
Agent needs to make a decision:

1. Agent: "User just uploaded manuscript. What next?"
   Options: [
     "Generate quotes immediately",
     "Read documentation first",
     "Explore features",
     "Create email campaign"
   ]

2. Agent.makeIntelligentDecision(context, options)
   │
   ├─ Build prompt with persona characteristics
   ├─ Send to Claude API
   │
   │  Prompt: "You are simulating a BEGINNER user with:
   │           Tech Savvy: 3/10
   │           Patience: 5/10
   │           Goals: Learn platform basics
   │
   │           Context: User just uploaded manuscript
   │           Options: [...]
   │
   │           Which option would this persona choose?"
   │
   ├─ Claude analyzes persona traits
   ├─ Claude returns:
   │     {
   │       chosen: "Read documentation first",
   │       reasoning: "Beginner users prefer guidance...",
   │       confidence: 0.85
   │     }
   │
   └─ Log decision and continue execution

3. Agent proceeds with chosen action
```

## Key Design Patterns

### 1. Template Method Pattern

**TestAgent** uses template method for extensibility:

```typescript
abstract class TestAgent {
  // Template method
  async executeTestFlow(): Promise<TestResult> {
    // Defined in subclass
  }

  // Common implementations
  protected async makeIntelligentDecision(...) { }
  protected async executeAction(...) { }
  protected async humanDelay() { }
}

class LuminaBetaUserAgent extends TestAgent {
  // Implement template method
  async executeTestFlow() {
    // LUMINA-specific flow
  }
}
```

### 2. Strategy Pattern

**Execution Strategy** varies based on test type:

```typescript
if (config.testType === 'serial') {
  results = await this.executeSerial(agents);
} else {
  results = await this.executeParallel(agents);
}
```

### 3. Observer Pattern

**Metrics Collection** observes agent actions:

```typescript
protected async executeAction(actionType, actionFn) {
  const startTime = Date.now();

  try {
    const result = await actionFn();
    const duration = Date.now() - startTime;

    // Notify observers (metrics)
    this.metrics.actions.push({
      type: actionType,
      duration,
      success: true,
      ...
    });
    this.metrics.responseTimes.push(duration);
  } catch (error) {
    // Record error
    this.metrics.errors.push(...);
  }
}
```

### 4. Factory Pattern

**Persona Factory** creates personas:

```typescript
class PersonaGenerator {
  static generate(type: PersonaType): UserPersona {
    const template = this.getBasePersonas()[type];
    return {
      // Build persona from template
    };
  }
}
```

### 5. Repository Pattern

**Prisma ORM** abstracts database access:

```typescript
await this.prisma.testRun.create({ data: {...} });
await this.prisma.testAgent.updateMany({ where: {...}, data: {...} });
const results = await this.prisma.testRun.findUnique({ include: {...} });
```

## Performance Considerations

### 1. Queue Management

**Problem**: Running 50 agents simultaneously overwhelms the platform.

**Solution**: Wave-based execution with concurrency control.

```typescript
const queue = new PQueue({ concurrency: 5 });

// Only 5 agents run at a time
for (const agent of agents) {
  queue.add(() => agent.executeTestFlow());
}
```

### 2. Database Optimization

**Problem**: Frequent database writes slow down execution.

**Solution**: Batch updates at agent completion.

```typescript
// Instead of updating on each action:
await prisma.testAgent.update({ ... }); // ❌ Slow

// Update once at the end:
await prisma.testAgent.updateMany({ ... }); // ✅ Fast
```

### 3. Memory Management

**Problem**: Storing all agent logs in memory.

**Solution**: Stream logs to files immediately.

```typescript
const logger = winston.createLogger({
  transports: [
    new winston.transports.File({ filename: `agent-${name}.log` })
  ]
});
```

### 4. API Rate Limiting

**Problem**: Claude API rate limits.

**Solution**: Retry with exponential backoff.

```typescript
try {
  return await this.anthropic.messages.create({ ... });
} catch (error) {
  if (error.status === 429) {
    await this.delay(1000 * attempts);
    // Retry
  }
}
```

## Security Considerations

### 1. Environment Variables

All sensitive data stored in `.env`:
- Database credentials
- API keys
- Platform URLs

### 2. Database Security

- Parameterized queries (Prisma prevents SQL injection)
- Connection pooling
- Prepared statements

### 3. API Security

- Session cookies stored securely
- HTTPS for API calls
- API key rotation support

### 4. Data Privacy

- Test data is synthetic
- No real user PII
- Database can be reset between tests

## Scalability

### Horizontal Scaling

Run multiple orchestrators in parallel:

```bash
# Terminal 1
npm run test:lumina:parallel -- --agents 20

# Terminal 2
npm run test:lumina:parallel -- --agents 20

# Total: 40 agents across 2 orchestrators
```

### Vertical Scaling

Increase concurrency:

```bash
# Run more agents simultaneously
npm run test:lumina:parallel -- --concurrent 10
```

### Cloud Deployment

Deploy to cloud for unlimited scale:

- AWS Lambda (serverless agents)
- Kubernetes (containerized orchestrator)
- RDS (managed PostgreSQL)

## Monitoring & Observability

### 1. Logging

**Levels:**
- DEBUG: Detailed execution logs
- INFO: Key actions and decisions
- WARN: Recoverable errors
- ERROR: Failed actions

**Outputs:**
- Console (real-time)
- Files (persistent)

### 2. Metrics

**Tracked Metrics:**
- Response times (min, max, avg, percentiles)
- Throughput (requests/second)
- Error rates (by type, severity)
- Success rates (per agent, overall)
- Resource usage (CPU, memory, database connections)

### 3. Alerts

**Future Enhancement:**
- Slack notifications on failure
- Email alerts for critical errors
- Dashboard for real-time monitoring

## Extensibility

### Adding New Platforms

1. Create agent class:
```typescript
class ReadWorthyBetaUserAgent extends TestAgent {
  async executeTestFlow() {
    // Implement ReadWorthy-specific flow
  }
}
```

2. Create scenarios:
```typescript
// scenarios/readworthy/complete-onboarding.ts
export const completeOnboardingScenario = { ... };
```

3. Add execution script:
```typescript
// scripts/run-readworthy-tests.ts
orchestrator.executeTest(config, ReadWorthyBetaUserAgent);
```

### Adding Custom Personas

```typescript
PersonaGenerator.generate(PersonaType.CUSTOM, {
  techSavvy: 6,
  patience: 7,
  goals: ['Custom goal'],
  ...
});
```

### Adding Custom Metrics

```typescript
await prisma.testMetric.create({
  data: {
    testRunId,
    metricType: 'CUSTOM_METRIC',
    value: customValue,
    unit: 'custom_unit'
  }
});
```

## Technology Stack

| Component | Technology | Purpose |
|-----------|------------|---------|
| Runtime | Node.js 18+ | JavaScript execution |
| Language | TypeScript | Type safety |
| AI Engine | Claude 3.5 Sonnet | Decision making |
| Database | PostgreSQL | Test result storage |
| ORM | Prisma | Database abstraction |
| HTTP Client | Axios | API requests |
| Queue | p-queue | Concurrency control |
| Logging | Winston | Structured logging |
| Date Handling | date-fns | Date formatting |

## Future Enhancements

1. **Real-time Dashboard**: Web UI for live test monitoring
2. **Video Recording**: Capture "screenshots" of agent actions
3. **A/B Testing**: Compare different platform versions
4. **ML-Powered Personas**: Learn from real user behavior
5. **CI/CD Integration**: Automated testing in pipelines
6. **Distributed Execution**: Run agents across multiple machines
7. **Custom Scenario Builder**: Visual flow designer
8. **Historical Trend Analysis**: Track metrics over time
9. **Chaos Engineering**: Simulate platform failures
10. **Multi-Platform Tests**: Test multiple platforms simultaneously

---

**Version**: 1.0.0
**Last Updated**: November 11, 2025
**Author**: APEXDEV Team
