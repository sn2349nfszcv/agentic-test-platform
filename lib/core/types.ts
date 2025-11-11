// Core types for the Agentic Test Platform

export enum PersonaType {
  BEGINNER = 'BEGINNER',
  INTERMEDIATE = 'INTERMEDIATE',
  EXPERT = 'EXPERT',
  POWER_USER = 'POWER_USER',
}

export enum TestStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
}

export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}

export interface UserPersona {
  id: string;
  name: string;
  type: PersonaType;
  characteristics: {
    techSavvy: number; // 1-10
    patience: number; // 1-10
    riskTolerance: number; // 1-10
    detailOriented: number; // 1-10
  };
  goals: string[];
  painPoints: string[];
  decisionPatterns: {
    explorationVsEfficiency: number; // 0-1 (0=efficient, 1=exploratory)
    errorHandling: 'retry' | 'give-up' | 'seek-help';
    featureAdoption: 'early' | 'cautious' | 'late';
  };
}

export interface TestAction {
  type: string;
  timestamp: Date;
  duration: number;
  success: boolean;
  details: Record<string, any>;
  error?: TestError;
}

export interface TestDecision {
  context: string;
  options: string[];
  chosen: string;
  reasoning: string;
  confidence: number; // 0-1
  timestamp: Date;
}

export interface TestError {
  type: string;
  severity: ErrorSeverity;
  message: string;
  stackTrace?: string;
  endpoint?: string;
  statusCode?: number;
  context?: Record<string, any>;
  timestamp: Date;
}

export interface TestMetrics {
  startTime: number;
  endTime?: number;
  duration?: number;
  actions: TestAction[];
  decisions: TestDecision[];
  errors: TestError[];
  successRate: number;
  stepsCompleted: number;
  stepsTotal: number;
  responseTimes: number[];
  customMetrics?: Record<string, any>;
}

export interface TestResult {
  agentName: string;
  persona: UserPersona;
  status: TestStatus;
  metrics: TestMetrics;
  summary: string;
  recommendations?: string[];
}

export interface TestScenario {
  id: string;
  name: string;
  description: string;
  steps: TestStep[];
  expectedDuration: number;
  priority: number;
  tags: string[];
}

export interface TestStep {
  id: string;
  name: string;
  description: string;
  action: () => Promise<any>;
  validation?: (result: any) => boolean | Promise<boolean>;
  expectedDuration?: number;
  retryable?: boolean;
  maxRetries?: number;
}

export interface TestConfig {
  platform: string;
  baseUrl: string;
  apiKey?: string;
  timeout: number;
  maxRetries: number;
  parallelAgents: number;
  enableDetailedLogging: boolean;
}

export interface ClaudeDecisionRequest {
  context: string;
  options: string[];
  personaTraits: Record<string, any>;
  previousActions: TestAction[];
}

export interface ClaudeDecisionResponse {
  chosen: string;
  reasoning: string;
  confidence: number;
}
