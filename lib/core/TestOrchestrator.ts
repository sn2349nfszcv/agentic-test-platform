// Test Orchestrator - Manages parallel execution of test agents

import PQueue from 'p-queue';
import { PrismaClient } from '@prisma/client';
import * as winston from 'winston';
import { format } from 'date-fns';
import { TestAgent } from './TestAgent';
import { TestResult, TestStatus, UserPersona, TestConfig } from './types';
import { PersonaGenerator } from '../utils/persona-generator';

interface OrchestrationConfig {
  platform: string;
  testType: 'parallel' | 'serial' | 'stress';
  agentCount: number;
  maxConcurrent: number;
  config: TestConfig;
}

interface OrchestrationResult {
  testRunId: string;
  totalAgents: number;
  completedAgents: number;
  failedAgents: number;
  duration: number;
  successRate: number;
  results: TestResult[];
}

export class TestOrchestrator {
  private prisma: PrismaClient;
  private logger: winston.Logger;
  private queue: PQueue;
  private activeAgents: Map<string, TestAgent> = new Map();

  constructor() {
    this.prisma = new PrismaClient();

    this.logger = winston.createLogger({
      level: 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `[${timestamp}] [ORCHESTRATOR] ${level.toUpperCase()}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: `./test-results/orchestrator-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.log`,
        }),
      ],
    });

    this.queue = new PQueue({ concurrency: 1 }); // Will be updated per test
  }

  /**
   * Execute test run with multiple agents
   */
  async executeTest(
    config: OrchestrationConfig,
    AgentClass: new (name: string, persona: UserPersona, testConfig: TestConfig) => TestAgent
  ): Promise<OrchestrationResult> {
    this.logger.info('Starting orchestrated test run', {
      platform: config.platform,
      testType: config.testType,
      agentCount: config.agentCount,
      maxConcurrent: config.maxConcurrent,
    });

    const startTime = Date.now();

    // Create test run record
    const testRun = await this.prisma.testRun.create({
      data: {
        platform: config.platform,
        testType: config.testType,
        agentCount: config.agentCount,
        totalDuration: 0,
        successRate: 0,
        status: 'RUNNING',
        configuration: config as any,
      },
    });

    this.logger.info('Test run created', { testRunId: testRun.id });

    // Update queue concurrency
    this.queue = new PQueue({ concurrency: config.maxConcurrent });

    // Generate personas
    const personas = PersonaGenerator.generateBatch(config.agentCount);

    // Create agents
    const agents: TestAgent[] = [];
    for (let i = 0; i < config.agentCount; i++) {
      const agentName = `${config.platform}_agent_${i + 1}`;
      const agent = new AgentClass(agentName, personas[i], config.config);
      agents.push(agent);
      this.activeAgents.set(agentName, agent);

      // Create agent record in database
      await this.prisma.testAgent.create({
        data: {
          testRunId: testRun.id,
          agentName,
          personaType: personas[i].type,
          stepsTotal: 12, // Default for LUMINA
          successRate: 0,
          metrics: {},
          errors: [],
          decisions: [],
          actions: [],
        },
      });
    }

    this.logger.info('Agents created', { count: agents.length });

    // Execute agents based on test type
    let results: TestResult[];
    if (config.testType === 'serial') {
      results = await this.executeSerial(agents, testRun.id);
    } else {
      results = await this.executeParallel(agents, testRun.id);
    }

    const endTime = Date.now();
    const duration = endTime - startTime;

    // Calculate metrics
    const completedAgents = results.filter((r) => r.status === TestStatus.COMPLETED).length;
    const failedAgents = results.filter((r) => r.status === TestStatus.FAILED).length;
    const successRate = (completedAgents / config.agentCount) * 100;

    // Calculate average response time
    const allResponseTimes = results
      .flatMap((r) => r.metrics.responseTimes)
      .filter((t) => t > 0);
    const avgResponseTime =
      allResponseTimes.length > 0
        ? Math.round(allResponseTimes.reduce((a, b) => a + b, 0) / allResponseTimes.length)
        : 0;

    // Calculate throughput (requests per second)
    const totalRequests = results.reduce((sum, r) => sum + r.metrics.actions.length, 0);
    const throughput = (totalRequests / (duration / 1000)).toFixed(2);

    // Update test run
    await this.prisma.testRun.update({
      where: { id: testRun.id },
      data: {
        completedAt: new Date(),
        totalDuration: duration,
        successRate,
        avgResponseTime,
        throughput: parseFloat(throughput),
        errorCount: results.reduce((sum, r) => sum + r.metrics.errors.length, 0),
        status: 'COMPLETED',
        results: results as any,
      },
    });

    // Update agent records
    for (const result of results) {
      await this.prisma.testAgent.updateMany({
        where: {
          testRunId: testRun.id,
          agentName: result.agentName,
        },
        data: {
          status: result.status,
          completedAt: new Date(),
          duration: result.metrics.duration,
          stepsCompleted: result.metrics.stepsCompleted,
          successRate: result.metrics.successRate,
          errors: result.metrics.errors as any,
          decisions: result.metrics.decisions as any,
          actions: result.metrics.actions as any,
          metrics: result.metrics as any,
        },
      });
    }

    // Log errors to separate table
    for (const result of results) {
      for (const error of result.metrics.errors) {
        await this.prisma.testError.create({
          data: {
            testRunId: testRun.id,
            agentName: result.agentName,
            errorType: error.type,
            severity: error.severity,
            message: error.message,
            stackTrace: error.stackTrace,
            endpoint: error.endpoint,
            statusCode: error.statusCode,
            context: error.context as any,
            timestamp: error.timestamp,
          },
        });
      }
    }

    this.logger.info('Test run completed', {
      testRunId: testRun.id,
      duration: `${duration}ms`,
      successRate: `${successRate.toFixed(2)}%`,
      completedAgents,
      failedAgents,
      avgResponseTime: `${avgResponseTime}ms`,
      throughput: `${throughput} req/s`,
    });

    // Clean up
    this.activeAgents.clear();

    return {
      testRunId: testRun.id,
      totalAgents: config.agentCount,
      completedAgents,
      failedAgents,
      duration,
      successRate,
      results,
    };
  }

  /**
   * Execute agents in parallel (wave-based)
   */
  private async executeParallel(
    agents: TestAgent[],
    testRunId: string
  ): Promise<TestResult[]> {
    this.logger.info('Executing agents in parallel', {
      count: agents.length,
      concurrency: this.queue.concurrency,
    });

    const results: TestResult[] = [];

    // Add all agents to queue
    const promises = agents.map((agent) =>
      this.queue.add(async () => {
        try {
          this.logger.info(`Starting agent`, { name: agent.getStatus() });

          const result = await agent.executeTestFlow();
          results.push(result);

          this.logger.info('Agent completed', {
            name: result.agentName,
            status: result.status,
            duration: `${result.metrics.duration}ms`,
            successRate: `${result.metrics.successRate.toFixed(2)}%`,
          });

          return result;
        } catch (error: any) {
          this.logger.error('Agent execution failed', {
            agent: agent.getStatus(),
            error: error.message,
          });
          throw error;
        }
      })
    );

    // Wait for all agents to complete
    await Promise.allSettled(promises);

    return results;
  }

  /**
   * Execute agents serially (one after another)
   */
  private async executeSerial(
    agents: TestAgent[],
    testRunId: string
  ): Promise<TestResult[]> {
    this.logger.info('Executing agents serially', { count: agents.length });

    const results: TestResult[] = [];

    for (const agent of agents) {
      try {
        this.logger.info('Starting agent', { name: agent.getStatus() });

        const result = await agent.executeTestFlow();
        results.push(result);

        this.logger.info('Agent completed', {
          name: result.agentName,
          status: result.status,
          duration: `${result.metrics.duration}ms`,
        });
      } catch (error: any) {
        this.logger.error('Agent execution failed', {
          agent: agent.getStatus(),
          error: error.message,
        });

        // Continue with next agent even if this one fails
      }
    }

    return results;
  }

  /**
   * Get status of active test run
   */
  async getTestRunStatus(testRunId: string) {
    const testRun = await this.prisma.testRun.findUnique({
      where: { id: testRunId },
      include: {
        agents: true,
        metrics: true,
        errors: true,
      },
    });

    if (!testRun) {
      throw new Error(`Test run not found: ${testRunId}`);
    }

    return {
      id: testRun.id,
      status: testRun.status,
      platform: testRun.platform,
      agentCount: testRun.agentCount,
      completedAgents: testRun.agents.filter((a) => a.status === 'COMPLETED').length,
      runningAgents: testRun.agents.filter((a) => a.status === 'RUNNING').length,
      failedAgents: testRun.agents.filter((a) => a.status === 'FAILED').length,
      duration: testRun.totalDuration,
      successRate: testRun.successRate,
      avgResponseTime: testRun.avgResponseTime,
      throughput: testRun.throughput,
      errorCount: testRun.errorCount,
      startedAt: testRun.startedAt,
      completedAt: testRun.completedAt,
    };
  }

  /**
   * Get detailed test results
   */
  async getTestResults(testRunId: string) {
    const testRun = await this.prisma.testRun.findUnique({
      where: { id: testRunId },
      include: {
        agents: true,
        errors: {
          orderBy: { timestamp: 'desc' },
        },
        metrics: {
          orderBy: { timestamp: 'desc' },
        },
      },
    });

    return testRun;
  }

  /**
   * Cleanup - close database connection
   */
  async cleanup() {
    await this.prisma.$disconnect();
  }
}
