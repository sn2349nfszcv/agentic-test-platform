// Base TestAgent class for autonomous testing

import Anthropic from '@anthropic-ai/sdk';
import axios, { AxiosInstance } from 'axios';
import { format } from 'date-fns';
import * as winston from 'winston';
import {
  UserPersona,
  TestMetrics,
  TestResult,
  TestAction,
  TestDecision,
  TestError,
  TestStatus,
  ErrorSeverity,
  ClaudeDecisionRequest,
  ClaudeDecisionResponse,
  TestConfig,
} from './types';

export abstract class TestAgent {
  protected anthropic: Anthropic;
  protected http: AxiosInstance;
  protected persona: UserPersona;
  protected metrics: TestMetrics;
  protected config: TestConfig;
  protected logger: winston.Logger;
  protected agentName: string;
  protected status: TestStatus;

  constructor(agentName: string, persona: UserPersona, config: TestConfig) {
    this.agentName = agentName;
    this.persona = persona;
    this.config = config;
    this.status = TestStatus.PENDING;

    // Initialize Anthropic client
    this.anthropic = new Anthropic({
      apiKey: process.env.ANTHROPIC_API_KEY!,
    });

    // Initialize HTTP client with timeout and retry logic
    this.http = axios.create({
      baseURL: config.baseUrl,
      timeout: config.timeout,
      headers: config.apiKey
        ? { Authorization: `Bearer ${config.apiKey}` }
        : {},
    });

    // Initialize logger
    this.logger = winston.createLogger({
      level: config.enableDetailedLogging ? 'debug' : 'info',
      format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message, ...meta }) => {
          return `[${timestamp}] [${this.agentName}] ${level.toUpperCase()}: ${message} ${
            Object.keys(meta).length ? JSON.stringify(meta) : ''
          }`;
        })
      ),
      transports: [
        new winston.transports.Console(),
        new winston.transports.File({
          filename: `./test-results/${config.platform}-${agentName}-${format(new Date(), 'yyyy-MM-dd-HH-mm')}.log`,
        }),
      ],
    });

    // Initialize metrics
    this.metrics = {
      startTime: Date.now(),
      actions: [],
      decisions: [],
      errors: [],
      successRate: 0,
      stepsCompleted: 0,
      stepsTotal: 0,
      responseTimes: [],
    };

    this.logger.info(`Agent initialized`, {
      persona: persona.name,
      type: persona.type,
    });
  }

  /**
   * Abstract method - Must be implemented by subclasses
   * Executes the complete test flow for this agent
   */
  abstract executeTestFlow(): Promise<TestResult>;

  /**
   * Abstract method - Must be implemented by subclasses
   * Generates realistic content based on persona
   */
  abstract generateRealisticContent(contentType: string): Promise<any>;

  /**
   * Use Claude to make intelligent decisions based on persona
   */
  protected async makeIntelligentDecision(
    context: string,
    options: string[]
  ): Promise<ClaudeDecisionResponse> {
    this.logger.debug('Making intelligent decision', { context, options });

    const prompt = `You are simulating a user with the following persona:
- Name: ${this.persona.name}
- Type: ${this.persona.type}
- Tech Savviness: ${this.persona.characteristics.techSavvy}/10
- Patience: ${this.persona.characteristics.patience}/10
- Risk Tolerance: ${this.persona.characteristics.riskTolerance}/10
- Detail Oriented: ${this.persona.characteristics.detailOriented}/10
- Goals: ${this.persona.goals.join(', ')}
- Pain Points: ${this.persona.painPoints.join(', ')}
- Exploration vs Efficiency: ${this.persona.decisionPatterns.explorationVsEfficiency}
- Error Handling: ${this.persona.decisionPatterns.errorHandling}
- Feature Adoption: ${this.persona.decisionPatterns.featureAdoption}

Context: ${context}

Available options:
${options.map((opt, i) => `${i + 1}. ${opt}`).join('\n')}

Based on this persona's characteristics, which option would they most likely choose?

Respond in JSON format:
{
  "chosen": "option text",
  "reasoning": "why this persona would choose this",
  "confidence": 0.0-1.0
}`;

    try {
      const response = await this.anthropic.messages.create({
        model: 'claude-3-5-sonnet-20241022',
        max_tokens: 500,
        messages: [{ role: 'user', content: prompt }],
      });

      const content = response.content[0];
      const text = content.type === 'text' ? content.text : '';
      const decision: ClaudeDecisionResponse = JSON.parse(text);

      // Log the decision
      const testDecision: TestDecision = {
        context,
        options,
        chosen: decision.chosen,
        reasoning: decision.reasoning,
        confidence: decision.confidence,
        timestamp: new Date(),
      };
      this.metrics.decisions.push(testDecision);

      this.logger.debug('Decision made', decision);
      return decision;
    } catch (error: any) {
      this.logger.error('Failed to make intelligent decision', {
        error: error.message,
      });
      // Fallback to random choice
      const chosen = options[Math.floor(Math.random() * options.length)];
      return {
        chosen,
        reasoning: 'Fallback to random choice due to Claude API error',
        confidence: 0.5,
      };
    }
  }

  /**
   * Execute an action with timing and error tracking
   */
  protected async executeAction(
    actionType: string,
    actionFn: () => Promise<any>,
    retryable: boolean = false
  ): Promise<any> {
    const startTime = Date.now();
    let attempts = 0;
    const maxAttempts = retryable ? this.config.maxRetries : 1;

    this.logger.info(`Executing action: ${actionType}`);

    while (attempts < maxAttempts) {
      attempts++;

      try {
        const result = await actionFn();
        const duration = Date.now() - startTime;

        // Record successful action
        const action: TestAction = {
          type: actionType,
          timestamp: new Date(),
          duration,
          success: true,
          details: { attempts, result },
        };
        this.metrics.actions.push(action);
        this.metrics.responseTimes.push(duration);
        this.metrics.stepsCompleted++;

        this.logger.info(`Action completed: ${actionType}`, {
          duration: `${duration}ms`,
          attempts,
        });

        return result;
      } catch (error: any) {
        const duration = Date.now() - startTime;
        const testError: TestError = {
          type: error.response?.data?.error || 'UNKNOWN',
          severity: this.categorizeErrorSeverity(error),
          message: error.message,
          stackTrace: error.stack,
          endpoint: error.config?.url,
          statusCode: error.response?.status,
          context: { actionType, attempt: attempts },
          timestamp: new Date(),
        };

        this.metrics.errors.push(testError);

        if (attempts < maxAttempts) {
          this.logger.warn(`Action failed, retrying (${attempts}/${maxAttempts})`, {
            actionType,
            error: error.message,
          });
          await this.delay(1000 * attempts); // Exponential backoff
        } else {
          this.logger.error(`Action failed permanently: ${actionType}`, {
            error: error.message,
          });

          // Record failed action
          const action: TestAction = {
            type: actionType,
            timestamp: new Date(),
            duration,
            success: false,
            details: { attempts },
            error: testError,
          };
          this.metrics.actions.push(action);

          throw error;
        }
      }
    }
  }

  /**
   * Categorize error severity based on error type
   */
  protected categorizeErrorSeverity(error: any): ErrorSeverity {
    const statusCode = error.response?.status;

    if (statusCode >= 500) return ErrorSeverity.CRITICAL;
    if (statusCode === 401 || statusCode === 403) return ErrorSeverity.HIGH;
    if (statusCode === 404 || statusCode === 400) return ErrorSeverity.MEDIUM;
    if (statusCode === 429) return ErrorSeverity.LOW;

    return ErrorSeverity.MEDIUM;
  }

  /**
   * Delay execution (for realistic pacing)
   */
  protected async delay(ms: number): Promise<void> {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Add realistic human-like delay based on persona
   */
  protected async humanDelay(): Promise<void> {
    // Beginner users are slower, experts are faster
    const baseDelay = this.persona.type === 'BEGINNER' ? 3000 :
                     this.persona.type === 'INTERMEDIATE' ? 2000 : 1000;

    // Add random variation (±50%)
    const variation = baseDelay * 0.5;
    const delay = baseDelay + (Math.random() * variation * 2 - variation);

    await this.delay(delay);
  }

  /**
   * Calculate final metrics and generate result
   */
  protected generateResult(status: TestStatus, summary: string): TestResult {
    this.status = status;
    this.metrics.endTime = Date.now();
    this.metrics.duration = this.metrics.endTime - this.metrics.startTime;

    // Calculate success rate
    const successfulActions = this.metrics.actions.filter((a) => a.success).length;
    this.metrics.successRate =
      this.metrics.actions.length > 0
        ? (successfulActions / this.metrics.actions.length) * 100
        : 0;

    this.logger.info('Test completed', {
      status,
      duration: `${this.metrics.duration}ms`,
      successRate: `${this.metrics.successRate.toFixed(2)}%`,
      stepsCompleted: `${this.metrics.stepsCompleted}/${this.metrics.stepsTotal}`,
      errorCount: this.metrics.errors.length,
    });

    return {
      agentName: this.agentName,
      persona: this.persona,
      status,
      metrics: this.metrics,
      summary,
    };
  }

  /**
   * Get current status
   */
  public getStatus(): TestStatus {
    return this.status;
  }

  /**
   * Get metrics
   */
  public getMetrics(): TestMetrics {
    return this.metrics;
  }
}
