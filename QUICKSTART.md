# Quick Start Guide - Agentic Test Platform

Get up and running in 5 minutes!

## Prerequisites

- ✅ Node.js 18+ installed
- ✅ PostgreSQL 14+ installed and running
- ✅ Anthropic API key ([Get one here](https://console.anthropic.com/))
- ✅ LUMINA platform running (default: http://localhost:3000)

## Step-by-Step Setup

### 1. Install Dependencies (Already Done!)

```bash
cd C:\apexdev\platforms\agentic-test-platform
npm install  # Already completed
```

### 2. Configure Database

Create a PostgreSQL database:

```sql
-- In PostgreSQL
CREATE DATABASE agentic_test_results;
```

### 3. Create Environment File

Copy `.env.example` to `.env` and fill in your values:

```bash
# Copy example
cp .env.example .env
```

Edit `.env`:

```env
# Database (update with your PostgreSQL credentials)
DATABASE_URL=postgresql://postgres:yourpassword@localhost:5432/agentic_test_results

# Anthropic API (get from https://console.anthropic.com/)
ANTHROPIC_API_KEY=sk-ant-your-key-here

# Target platform
LUMINA_BASE_URL=http://localhost:3000

# Test configuration (defaults are good)
MAX_PARALLEL_AGENTS=20
TEST_TIMEOUT_MS=30000
ENABLE_DETAILED_LOGGING=true
```

### 4. Initialize Database

Run Prisma migrations:

```bash
npx prisma migrate dev --name init
```

Expected output:
```
✔ Applied migration 00000000000000_init
✔ Generated Prisma Client
```

### 5. Verify Setup

Check that everything is ready:

```bash
# Check database connection
npx prisma db pull

# Check Prisma client
npx prisma generate

# Check TypeScript compilation
npm run build
```

### 6. Run Your First Test! 🚀

**Option A: Quick Serial Test (10 agents, ~15 min)**

```bash
npm run test:lumina
```

**Option B: Parallel Test (20 agents, ~3-4 hours)**

```bash
npm run test:lumina:parallel
```

**Option C: Small Test (3 agents for quick validation)**

```bash
npm run test:lumina -- --agents 3
```

### 7. View Results

After the test completes, you'll see:

```
╔═══════════════════════════════════════════════════════════╗
║                    TEST COMPLETED                          ║
╚═══════════════════════════════════════════════════════════╝

Results Summary:
  Test Run ID: cm1234567890
  Total Agents: 3
  ✅ Completed: 3
  ❌ Failed: 0
  Success Rate: 100.00%
  Duration: 45.32s

📊 Report saved to: test-results/lumina-test-report-2025-11-11-12-30-45.md

🎉 EXCELLENT! All tests passed with high success rate.
```

Open the report:

```bash
# On Windows
notepad test-results\lumina-test-report-*.md

# Or view in browser
start test-results\lumina-test-report-*.md
```

## Test Execution Matrix

| Command | Agents | Concurrent | Duration | Best For |
|---------|--------|------------|----------|----------|
| `npm run test:lumina` | 10 | 1 (serial) | ~15 min | Initial testing |
| `npm run test:lumina -- --agents 3` | 3 | 1 | ~5 min | Quick validation |
| `npm run test:lumina:parallel` | 20 | 5 | ~3-4 hrs | Realistic beta simulation |
| `npm run test:lumina:stress` | 50 | 10 | ~5-6 hrs | Stress testing |
| Custom | Custom | Custom | Varies | Advanced scenarios |

## Common Scenarios

### Scenario 1: Quick Smoke Test (5 minutes)

Before starting work, verify platform is functioning:

```bash
npm run test:lumina -- --agents 2
```

### Scenario 2: Pre-Deployment Validation (30 minutes)

Before deploying to production:

```bash
npm run test:lumina -- --agents 10 --concurrent 3
```

### Scenario 3: Full Beta Simulation (4 hours)

Simulate complete beta testing:

```bash
npm run test:lumina:parallel
```

### Scenario 4: Load Testing (6 hours)

Stress test the platform:

```bash
npm run test:lumina:stress
```

## Understanding Test Output

### Live Progress

```
[12:34:56] [lumina_agent_1] INFO: Agent initialized { persona: 'Novice Author 1' }
[12:34:57] [lumina_agent_1] INFO: Executing action: signup_or_login
[12:35:02] [lumina_agent_1] INFO: Action completed { duration: '450ms' }
[12:35:05] [lumina_agent_1] INFO: Executing action: upload_manuscript
```

### Agent Logs

Each agent creates a detailed log file:

```
test-results/
├── lumina-agent_1-2025-11-11-12-34.log  # Individual agent logs
├── lumina-agent_2-2025-11-11-12-34.log
├── orchestrator-2025-11-11-12-34.log    # Overall orchestration log
└── lumina-test-report-2025-11-11-12-37.md  # Final report
```

### Report Sections

1. **Summary**: Overview of test execution
2. **Agent Results Table**: Per-agent success/failure
3. **Error Analysis**: Categorized errors
4. **Performance Metrics**: Response times, throughput
5. **Recommendations**: Actionable insights

## Troubleshooting

### Issue: Database Connection Failed

```
Error: Can't reach database server at localhost:5432
```

**Solution:**
1. Ensure PostgreSQL is running
2. Check DATABASE_URL in `.env`
3. Verify database exists: `psql -l`

### Issue: Anthropic API Errors

```
Error: Invalid API key
```

**Solution:**
1. Check ANTHROPIC_API_KEY in `.env`
2. Verify key at https://console.anthropic.com/
3. Ensure you have sufficient API credits

### Issue: LUMINA Platform Not Responding

```
Error: ECONNREFUSED 127.0.0.1:3000
```

**Solution:**
1. Start LUMINA platform: `cd lumina-marketing && npm run dev`
2. Check LUMINA_BASE_URL in `.env`
3. Verify port 3000 is accessible

### Issue: TypeScript Compilation Errors

```
Error: Cannot find module '@prisma/client'
```

**Solution:**
```bash
# Regenerate Prisma client
npx prisma generate

# Rebuild TypeScript
npm run build
```

## Next Steps

### 1. Customize Test Configuration

Edit `.env` to adjust test behavior:

```env
# Run more agents in parallel
MAX_PARALLEL_AGENTS=30

# Increase timeout for slow networks
TEST_TIMEOUT_MS=60000

# Enable detailed debugging
ENABLE_DETAILED_LOGGING=true
```

### 2. View Test History

Query past test runs:

```bash
npx prisma studio
```

Navigate to `TestRun` table to see all historical results.

### 3. Analyze Trends

Compare test runs over time:

```sql
SELECT
  id,
  startedAt,
  agentCount,
  successRate,
  avgResponseTime,
  errorCount
FROM "TestRun"
ORDER BY startedAt DESC
LIMIT 10;
```

### 4. Add Custom Scenarios

Create platform-specific test scenarios in `scenarios/lumina/`.

### 5. Extend to Other Platforms

Follow the README guide to add support for ReadWorthy, Scholarly, etc.

## Tips for Best Results

1. **Start Small**: Run 2-3 agents first to verify setup
2. **Check Platform Health**: Ensure target platform is responding
3. **Monitor Resources**: Watch CPU/memory during parallel tests
4. **Review Logs**: Check individual agent logs for detailed insights
5. **Iterate**: Use recommendations from reports to improve platform
6. **Automate**: Integrate into CI/CD for continuous testing

## Help & Support

**Documentation:**
- README.md - Complete documentation
- QUICKSTART.md - This guide
- Architecture diagrams (coming soon)

**Common Commands:**
```bash
# View database schema
npx prisma studio

# Reset database
npx prisma migrate reset

# Generate new migration
npx prisma migrate dev --name your_migration_name

# View Prisma client
cat node_modules/.prisma/client/index.d.ts
```

**Need Help?**
- Check logs in `test-results/`
- Review error messages in reports
- Verify all environment variables
- Ensure all services are running

---

## Success Criteria

Your setup is complete when:

- ✅ `npm run test:lumina -- --agents 2` completes successfully
- ✅ Report is generated in `test-results/`
- ✅ Database contains TestRun records
- ✅ Success rate is > 80%

**You're ready to go! 🚀**

Run `npm run test:lumina:parallel` to simulate a complete beta test.
