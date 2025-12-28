-- CreateTable
CREATE TABLE "TestRun" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "testType" TEXT NOT NULL,
    "agentCount" INTEGER NOT NULL,
    "totalDuration" INTEGER NOT NULL,
    "successRate" DECIMAL(5,2) NOT NULL,
    "avgResponseTime" INTEGER,
    "throughput" DECIMAL(10,2),
    "errorCount" INTEGER NOT NULL DEFAULT 0,
    "startedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "completedAt" TIMESTAMP(3),
    "status" TEXT NOT NULL DEFAULT 'RUNNING',
    "configuration" JSONB NOT NULL,
    "results" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestRun_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestAgent" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "agentName" TEXT NOT NULL,
    "personaType" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PENDING',
    "startedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "duration" INTEGER,
    "stepsCompleted" INTEGER NOT NULL DEFAULT 0,
    "stepsTotal" INTEGER NOT NULL,
    "successRate" DECIMAL(5,2) NOT NULL,
    "errors" JSONB[],
    "decisions" JSONB[],
    "actions" JSONB[],
    "metrics" JSONB NOT NULL,

    CONSTRAINT "TestAgent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestMetric" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "metricType" TEXT NOT NULL,
    "value" DECIMAL(12,4) NOT NULL,
    "unit" TEXT NOT NULL,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metadata" JSONB,

    CONSTRAINT "TestMetric_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestError" (
    "id" TEXT NOT NULL,
    "testRunId" TEXT NOT NULL,
    "agentName" TEXT,
    "errorType" TEXT NOT NULL,
    "severity" TEXT NOT NULL,
    "message" TEXT NOT NULL,
    "stackTrace" TEXT,
    "endpoint" TEXT,
    "statusCode" INTEGER,
    "context" JSONB,
    "timestamp" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "TestError_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestScenario" (
    "id" TEXT NOT NULL,
    "platform" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL,
    "steps" JSONB NOT NULL,
    "expectedDuration" INTEGER NOT NULL,
    "priority" INTEGER NOT NULL DEFAULT 1,
    "tags" TEXT[],
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestScenario_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "TestPersona" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "characteristics" JSONB NOT NULL,
    "goals" TEXT[],
    "painPoints" TEXT[],
    "decisionPatterns" JSONB NOT NULL,
    "platform" TEXT NOT NULL,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "TestPersona_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "TestRun_platform_startedAt_idx" ON "TestRun"("platform", "startedAt");

-- CreateIndex
CREATE INDEX "TestRun_status_idx" ON "TestRun"("status");

-- CreateIndex
CREATE INDEX "TestAgent_testRunId_status_idx" ON "TestAgent"("testRunId", "status");

-- CreateIndex
CREATE INDEX "TestAgent_personaType_idx" ON "TestAgent"("personaType");

-- CreateIndex
CREATE INDEX "TestMetric_testRunId_metricType_timestamp_idx" ON "TestMetric"("testRunId", "metricType", "timestamp");

-- CreateIndex
CREATE INDEX "TestError_testRunId_errorType_idx" ON "TestError"("testRunId", "errorType");

-- CreateIndex
CREATE INDEX "TestError_severity_timestamp_idx" ON "TestError"("severity", "timestamp");

-- CreateIndex
CREATE INDEX "TestScenario_platform_isActive_idx" ON "TestScenario"("platform", "isActive");

-- CreateIndex
CREATE UNIQUE INDEX "TestScenario_platform_name_key" ON "TestScenario"("platform", "name");

-- CreateIndex
CREATE INDEX "TestPersona_type_platform_idx" ON "TestPersona"("type", "platform");

-- CreateIndex
CREATE UNIQUE INDEX "TestPersona_name_key" ON "TestPersona"("name");

-- AddForeignKey
ALTER TABLE "TestAgent" ADD CONSTRAINT "TestAgent_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestMetric" ADD CONSTRAINT "TestMetric_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "TestError" ADD CONSTRAINT "TestError_testRunId_fkey" FOREIGN KEY ("testRunId") REFERENCES "TestRun"("id") ON DELETE CASCADE ON UPDATE CASCADE;
