// Generate comprehensive test reports

import { PrismaClient } from '@prisma/client';
import { writeFileSync } from 'fs';
import { format } from 'date-fns';

interface ReportOptions {
  testRunId: string;
  outputPath?: string;
  format?: 'markdown' | 'json' | 'html';
}

export class ReportGenerator {
  private prisma: PrismaClient;

  constructor() {
    this.prisma = new PrismaClient();
  }

  /**
   * Generate comprehensive test report
   */
  async generateReport(options: ReportOptions): Promise<string> {
    const testRun = await this.prisma.testRun.findUnique({
      where: { id: options.testRunId },
      include: {
        agents: true,
        errors: {
          orderBy: { timestamp: 'desc' },
        },
        metrics: true,
      },
    });

    if (!testRun) {
      throw new Error(`Test run not found: ${options.testRunId}`);
    }

    const reportFormat = options.format || 'markdown';

    let report: string;
    if (reportFormat === 'markdown') {
      report = this.generateMarkdownReport(testRun);
    } else if (reportFormat === 'json') {
      report = JSON.stringify(testRun, null, 2);
    } else {
      report = this.generateHTMLReport(testRun);
    }

    // Save to file if path provided
    if (options.outputPath) {
      writeFileSync(options.outputPath, report, 'utf-8');
    }

    return report;
  }

  /**
   * Generate markdown report
   */
  private generateMarkdownReport(testRun: any): string {
    const duration = (testRun.totalDuration / 1000).toFixed(2);
    const successRate = testRun.successRate.toFixed(2);

    return `# Test Run Report: ${testRun.platform.toUpperCase()}

**Test Run ID:** ${testRun.id}
**Platform:** ${testRun.platform}
**Test Type:** ${testRun.testType}
**Status:** ${testRun.status}
**Started:** ${format(new Date(testRun.startedAt), 'yyyy-MM-dd HH:mm:ss')}
**Completed:** ${testRun.completedAt ? format(new Date(testRun.completedAt), 'yyyy-MM-dd HH:mm:ss') : 'In Progress'}
**Duration:** ${duration}s

---

## Summary

| Metric | Value |
|--------|-------|
| Total Agents | ${testRun.agentCount} |
| Completed | ${testRun.agents.filter((a: any) => a.status === 'COMPLETED').length} |
| Failed | ${testRun.agents.filter((a: any) => a.status === 'FAILED').length} |
| Success Rate | ${successRate}% |
| Avg Response Time | ${testRun.avgResponseTime || 0}ms |
| Throughput | ${testRun.throughput || 0} req/s |
| Total Errors | ${testRun.errorCount} |

---

## Agent Results

${this.generateAgentTable(testRun.agents)}

---

## Error Analysis

${this.generateErrorAnalysis(testRun.errors)}

---

## Performance Metrics

### Response Time Distribution

- **Min:** ${this.calculateMin(testRun.agents)}ms
- **Max:** ${this.calculateMax(testRun.agents)}ms
- **Avg:** ${testRun.avgResponseTime || 0}ms
- **P50:** ${this.calculatePercentile(testRun.agents, 50)}ms
- **P95:** ${this.calculatePercentile(testRun.agents, 95)}ms
- **P99:** ${this.calculatePercentile(testRun.agents, 99)}ms

### Throughput

- **Total Requests:** ${this.calculateTotalRequests(testRun.agents)}
- **Requests/Second:** ${testRun.throughput || 0}
- **Duration:** ${duration}s

---

## Persona Distribution

${this.generatePersonaDistribution(testRun.agents)}

---

## Top Errors

${this.generateTopErrors(testRun.errors)}

---

## Recommendations

${this.generateRecommendations(testRun)}

---

*Report generated at ${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}*
`;
  }

  /**
   * Generate HTML report
   */
  private generateHTMLReport(testRun: any): string {
    const markdownReport = this.generateMarkdownReport(testRun);
    // For now, just wrap in HTML (could use a proper markdown-to-html converter)
    return `<!DOCTYPE html>
<html>
<head>
  <title>Test Run Report - ${testRun.id}</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 1200px; margin: 0 auto; padding: 20px; }
    table { border-collapse: collapse; width: 100%; margin: 20px 0; }
    th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
    th { background-color: #4CAF50; color: white; }
    h1, h2, h3 { color: #333; }
    .success { color: green; }
    .error { color: red; }
  </style>
</head>
<body>
  <pre>${markdownReport}</pre>
</body>
</html>`;
  }

  /**
   * Generate agent results table
   */
  private generateAgentTable(agents: any[]): string {
    const table = `| Agent | Persona | Status | Duration | Steps | Success Rate | Errors |
|-------|---------|--------|----------|-------|--------------|--------|
${agents
  .map(
    (a) =>
      `| ${a.agentName} | ${a.personaType} | ${a.status} | ${a.duration || 0}ms | ${a.stepsCompleted}/${a.stepsTotal} | ${a.successRate.toFixed(2)}% | ${a.errors.length} |`
  )
  .join('\n')}`;

    return table;
  }

  /**
   * Generate error analysis
   */
  private generateErrorAnalysis(errors: any[]): string {
    if (errors.length === 0) {
      return '✅ No errors occurred during testing!';
    }

    const errorsBySeverity = {
      CRITICAL: errors.filter((e) => e.severity === 'CRITICAL').length,
      HIGH: errors.filter((e) => e.severity === 'HIGH').length,
      MEDIUM: errors.filter((e) => e.severity === 'MEDIUM').length,
      LOW: errors.filter((e) => e.severity === 'LOW').length,
    };

    return `**Total Errors:** ${errors.length}

**By Severity:**
- 🔴 CRITICAL: ${errorsBySeverity.CRITICAL}
- 🟠 HIGH: ${errorsBySeverity.HIGH}
- 🟡 MEDIUM: ${errorsBySeverity.MEDIUM}
- 🟢 LOW: ${errorsBySeverity.LOW}

**By Type:**
${this.groupErrorsByType(errors)}`;
  }

  /**
   * Group errors by type
   */
  private groupErrorsByType(errors: any[]): string {
    const grouped: Record<string, number> = {};
    errors.forEach((e) => {
      grouped[e.errorType] = (grouped[e.errorType] || 0) + 1;
    });

    return Object.entries(grouped)
      .sort((a, b) => b[1] - a[1])
      .map(([type, count]) => `- ${type}: ${count}`)
      .join('\n');
  }

  /**
   * Calculate min response time
   */
  private calculateMin(agents: any[]): number {
    const times = agents
      .filter((a) => a.duration)
      .map((a) => a.duration);
    return times.length > 0 ? Math.min(...times) : 0;
  }

  /**
   * Calculate max response time
   */
  private calculateMax(agents: any[]): number {
    const times = agents
      .filter((a) => a.duration)
      .map((a) => a.duration);
    return times.length > 0 ? Math.max(...times) : 0;
  }

  /**
   * Calculate percentile
   */
  private calculatePercentile(agents: any[], percentile: number): number {
    const times = agents
      .filter((a) => a.duration)
      .map((a) => a.duration)
      .sort((a, b) => a - b);

    if (times.length === 0) return 0;

    const index = Math.ceil((percentile / 100) * times.length) - 1;
    return times[index] || 0;
  }

  /**
   * Calculate total requests
   */
  private calculateTotalRequests(agents: any[]): number {
    return agents.reduce((sum, a) => {
      const actions = Array.isArray(a.actions) ? a.actions : [];
      return sum + actions.length;
    }, 0);
  }

  /**
   * Generate persona distribution
   */
  private generatePersonaDistribution(agents: any[]): string {
    const distribution: Record<string, number> = {};
    agents.forEach((a) => {
      distribution[a.personaType] = (distribution[a.personaType] || 0) + 1;
    });

    return Object.entries(distribution)
      .map(([type, count]) => `- ${type}: ${count} agents`)
      .join('\n');
  }

  /**
   * Generate top errors
   */
  private generateTopErrors(errors: any[]): string {
    if (errors.length === 0) {
      return 'No errors to display.';
    }

    return errors
      .slice(0, 10)
      .map(
        (e, i) =>
          `${i + 1}. **${e.errorType}** (${e.severity})\n   - Message: ${e.message}\n   - Endpoint: ${e.endpoint || 'N/A'}\n   - Status: ${e.statusCode || 'N/A'}`
      )
      .join('\n\n');
  }

  /**
   * Generate recommendations based on results
   */
  private generateRecommendations(testRun: any): string {
    const recommendations: string[] = [];

    // Success rate recommendations
    if (testRun.successRate < 80) {
      recommendations.push(
        '⚠️ **Low success rate (<80%):** Investigate common failure patterns and API reliability.'
      );
    }

    // Error recommendations
    if (testRun.errorCount > testRun.agentCount * 2) {
      recommendations.push(
        '⚠️ **High error count:** Review error logs and improve error handling.'
      );
    }

    // Performance recommendations
    if (testRun.avgResponseTime > 2000) {
      recommendations.push(
        '⚠️ **Slow response times (>2s):** Optimize API endpoints and database queries.'
      );
    }

    // Critical errors
    const criticalErrors = testRun.errors.filter(
      (e: any) => e.severity === 'CRITICAL'
    ).length;
    if (criticalErrors > 0) {
      recommendations.push(
        `🔴 **${criticalErrors} critical errors:** Address these immediately before beta launch.`
      );
    }

    if (recommendations.length === 0) {
      return '✅ **All tests passed successfully!** Platform is ready for beta testing.';
    }

    return recommendations.map((r, i) => `${i + 1}. ${r}`).join('\n');
  }

  /**
   * Cleanup
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}
