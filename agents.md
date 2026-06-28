# Multi-Agent IA Architecture

## 1. Architecture Overview

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        MULTI-AGENT IA SYSTEM                            │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐    │
│  │    Error     │────▶│  Error Analysis  │────▶│ Fix Suggestion   │    │
│  │  Collector   │     │     Agent        │     │     Agent        │    │
│  └──────────────┘     └──────────────────┘     └──────────────────┘    │
│           │                    │                         │              │
│           │                    ▼                         │              │
│           │           ┌──────────────────┐               │              │
│           │           │    Incident      │◀──────────────┘              │
│           │           │  Response Agent  │                               │
│           │           └────────┬─────────┘                               │
│           │                    │                                          │
│           │                    ▼                                          │
│           │           ┌──────────────────┐                                │
│           │           │   Alert Service  │                                │
│           │           └──────────────────┘                                │
│           │                                                               │
│           ▼                                                               │
│  ┌──────────────────┐                                                    │
│  │  Runtime         │─────────────────────────────────────┐              │
│  │  Monitoring      │─────────────────────────────────────┤              │
│  │  Agent           │─────────────────────────────────────┤              │
│  └────────┬─────────┘                                     │              │
│           │                                               ▼              │
│           │                                    ┌──────────────────┐     │
│           │                                    │  Auto Recovery   │     │
│           │                                    │     System       │     │
│           │                                    └──────────────────┘     │
│           │                                                               │
│           └───────────────────────────────────────────────────────────┐   │
│                                                                       ▼   │
│  ┌──────────────────────────────────────────────────────────────────────┐ │
│  │                        KNOWLEDGE BASE                                │ │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────┐ │ │
│  │  │ Errors  │ │  Fixes  │ │Patterns │ │Incidents│ │  Solutions    │ │ │
│  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────────────┘ │ │
│  └──────────────────────────────────────────────────────────────────────┘ │
│         ▲              ▲              ▲              ▲                    │
│         └──────────────┴──────────────┴──────────────┘                    │
│                        All agents read/write                              │
└─────────────────────────────────────────────────────────────────────────┘
```

### Data Flow Summary

```
Error Collector ──▶ Error Analysis ──▶ Fix Suggestion ──▶ Incident Response ──▶ Alert Service
       │                    │                  │                    │
       ▼                    ▼                  ▼                    ▼
  ┌────────────────────────────────────────────────────────────────────┐
  │                         KNOWLEDGE BASE                             │
  └────────────────────────────────────────────────────────────────────┘
       ▲
       │
  Runtime Monitoring ──▶ Auto Recovery
       │
       └──▶ Incident Response
```

---

## 2. Agent Responsibilities

### 2.1 Error Analysis Agent

**Purpose:** Analyze captured errors to understand root causes, classify severity, and detect patterns.

**Responsibilities:**

- Read and parse application logs (Winston, Loki)
- Analyze stack traces to identify failure points
- Detect recurring error patterns across time windows
- Classify error severity (CRITICAL, HIGH, MEDIUM, LOW, INFO)
- Detect root cause through trace correlation (Jaeger, OpenTelemetry)
- Correlate errors with system metrics (Prometheus)
- Identify error cascades and dependency failures
- Maintain error signature database for pattern matching

**Example Analysis Output:**

```json
{
  "errorId": "err-20260521-001",
  "timestamp": "2026-05-21T10:15:32.000Z",
  "severity": "CRITICAL",
  "pattern": "DatabaseConnectionTimeout",
  "rootCause": "PostgreSQL connection pool exhausted",
  "affectedServices": ["user-service", "order-service"],
  "stackTrace": {
    "file": "src/db/connection.ts",
    "line": 142,
    "function": "acquireConnection"
  },
  "correlationId": "corr-abc-123-def",
  "metrics": {
    "activeConnections": 100,
    "maxConnections": 100,
    "queueDepth": 47
  }
}
```

### 2.2 Fix Suggestion Agent

**Purpose:** Generate actionable fixes, patches, and refactoring recommendations based on error analysis.

**Responsibilities:**

- Generate code fixes based on error analysis results
- Explain the problem in human-readable terms
- Generate unified diff patches for quick application
- Propose refactoring to prevent recurrence
- Detect bad practices and code smells
- Validate fix safety through impact analysis
- Suggest configuration changes for infrastructure issues
- Provide rollback strategies for risky fixes

**Example Fix Suggestion:**

```json
{
  "fixId": "fix-20260521-001",
  "relatedError": "err-20260521-001",
  "problem": "Connection pool exhausted due to unclosed connections in error paths",
  "solution": "Add finally block to ensure connection release",
  "patch": "--- a/src/db/connection.ts\n+++ b/src/db/connection.ts\n@@ -138,7 +138,10 @@\n   const conn = await pool.acquire();\n-  return await conn.query(sql, params);\n+  try {\n+    return await conn.query(sql, params);\n+  } finally {\n+    await pool.release(conn);\n+  }",
  "confidence": 0.92,
  "riskLevel": "LOW",
  "rollbackStrategy": "Revert commit or disable pool recycling temporarily"
}
```

### 2.3 Runtime Monitoring Agent

**Purpose:** Continuously monitor system health, detect anomalies, and trigger recovery actions.

**Responsibilities:**

- Monitor CPU utilization and detect spikes
- Track RAM usage and identify memory leaks
- Monitor heap memory and garbage collection patterns
- Track API response times and latency percentiles (p50, p95, p99)
- Detect deadlocks through thread/request analysis
- Identify database bottlenecks (slow queries, lock contention)
- Monitor Redis saturation (memory, connections, eviction rate)
- Track queue congestion (BullMQ job backlog, failure rate)
- Detect anomalous behavior using baseline comparison
- Trigger auto-recovery actions when thresholds exceeded

**Monitored Metrics:**

```
┌─────────────────────────────────────────────────────────────┐
│                    MONITORED METRICS                        │
├──────────────────────┬──────────────────────────────────────┤
│ CPU                  │ Usage %, load average, iowait        │
│ Memory               │ RSS, heap used, heap total, external │
│ Memory Leaks         │ Heap growth rate, GC frequency       │
│ Response Times       │ p50, p95, p99 latency per endpoint   │
│ Deadlocks            │ Blocked requests, circular waits     │
│ DB Bottlenecks       │ Slow queries, lock wait time, pool   │
│ Redis Saturation     │ Memory used, connected clients, evict│
│ Queue Congestion     │ BullMQ waiting, active, failed jobs  │
│ Error Rate           │ Errors/min, error ratio              │
│ Throughput           │ Requests/sec, jobs/sec               │
└──────────────────────┴──────────────────────────────────────┘
```

**Example Alert:**

```json
{
  "alertId": "alert-20260521-001",
  "type": "MEMORY_LEAK_DETECTED",
  "severity": "HIGH",
  "metric": "heapUsed",
  "currentValue": "1.8GB",
  "threshold": "1.5GB",
  "trend": "increasing",
  "growthRate": "50MB/min",
  "estimatedTimeToOOM": "12 minutes",
  "recommendedAction": "Trigger graceful restart"
}
```

### 2.4 Incident Response Agent

**Purpose:** Manage incident lifecycle from detection through resolution, including reporting and alerting.

**Responsibilities:**

- Create detailed incident reports with full context
- Generate incident timelines from correlated events
- Group related errors into single incidents (deduplication)
- Generate executive and technical summaries
- Send alerts through configured channels (email, Slack, PagerDuty)
- Track incident status (open, investigating, mitigating, resolved)
- Coordinate response across multiple agents
- Maintain incident history for post-mortem analysis
- Escalate incidents based on severity and SLA

**Example Incident Report:**

```json
{
  "incidentId": "INC-20260521-001",
  "title": "Database Connection Pool Exhaustion",
  "status": "INVESTIGATING",
  "severity": "CRITICAL",
  "createdAt": "2026-05-21T10:15:35.000Z",
  "timeline": [
    { "time": "10:14:00", "event": "Connection pool usage exceeds 80%" },
    { "time": "10:14:30", "event": "Slow query detected (>5s)" },
    { "time": "10:15:00", "event": "Connection pool at 100%" },
    { "time": "10:15:32", "event": "First connection timeout error" },
    { "time": "10:15:35", "event": "Incident auto-created" }
  ],
  "affectedServices": ["user-service", "order-service", "payment-service"],
  "errorCount": 247,
  "relatedErrors": ["err-20260521-001", "err-20260521-002"],
  "suggestedFix": "fix-20260521-001",
  "alertsSent": ["slack-ops", "pagerduty-critical"],
  "summary": "PostgreSQL connection pool exhausted causing cascading failures across 3 services. Root cause: unclosed connections in error paths."
}
```

---

## 3. Workflows

### 3.1 Error Workflow

```
┌─────────┐    ┌─────┐    ┌───────┐    ┌─────────┐    ┌──────────┐
│ capture │───▶│ log │───▶│ trace │───▶│ analyze │───▶│ classify │
└─────────┘    └─────┘    └───────┘    └─────────┘    └──────────┘
                                                              │
                                                              ▼
┌──────────────┐    ┌─────────────┐    ┌────────────┐    ┌───────────┐
│ generateReport│◀──│ saveHistory │◀───│   alert   │◀───│createIncident│◀──│ suggestFix │
└──────────────┘    └─────────────┘    └────────────┘    └───────────┘    └───────────┘
```

**Step-by-step:**

| Step | Action             | Agent                   | Tool                   |
| ---- | ------------------ | ----------------------- | ---------------------- |
| 1    | **capture**        | Error Collector         | Winston, OpenTelemetry |
| 2    | **log**            | Error Collector         | Winston, Loki          |
| 3    | **trace**          | Error Collector         | Jaeger, OpenTelemetry  |
| 4    | **analyze**        | Error Analysis Agent    | Stack trace parser     |
| 5    | **classify**       | Error Analysis Agent    | Pattern matcher        |
| 6    | **diagnose**       | Error Analysis Agent    | Root cause analyzer    |
| 7    | **suggestFix**     | Fix Suggestion Agent    | Code analyzer          |
| 8    | **createIncident** | Incident Response Agent | Incident manager       |
| 9    | **alert**          | Incident Response Agent | Alert Service          |
| 10   | **saveHistory**    | All Agents              | Knowledge Base         |
| 11   | **generateReport** | Incident Response Agent | Report generator       |

### 3.2 Monitoring Workflow

```
┌──────────┐    ┌─────────┐    ┌───────┐    ┌─────────┐
│ monitor  │───▶│ detect  │───▶│ alert │───▶│ recover │
└──────────┘    └─────────┘    └───────┘    └─────────┘
      │              │              │              │
      ▼              ▼              ▼              ▼
  Prometheus    Anomaly       Alert Service   Auto Recovery
  Metrics       Detection                     System
```

**Step-by-step:**

| Step | Action      | Agent                    | Action                               |
| ---- | ----------- | ------------------------ | ------------------------------------ |
| 1    | **monitor** | Runtime Monitoring Agent | Collect metrics continuously         |
| 2    | **detect**  | Runtime Monitoring Agent | Compare against thresholds/baselines |
| 3    | **alert**   | Runtime Monitoring Agent | Send to Incident Response Agent      |
| 4    | **recover** | Runtime Monitoring Agent | Trigger auto-recovery if configured  |

### 3.3 Analysis Workflow

```
┌──────────┐    ┌─────────┐    ┌──────────┐    ┌─────────────┐
│ collect  │───▶│ analyze │───▶│ suggest  │───▶│   learn     │
└──────────┘    └─────────┘    └──────────┘    └─────────────┘
      │              │              │              │
      ▼              ▼              ▼              ▼
  Error Logs    Pattern        Fix Patches    Knowledge Base
  Stack Traces  Detection      Refactors      Update
  Metrics       Root Cause     Best Practices Store Result
```

**Step-by-step:**

| Step | Action      | Agent                | Output                |
| ---- | ----------- | -------------------- | --------------------- |
| 1    | **collect** | Error Analysis Agent | Raw error data        |
| 2    | **analyze** | Error Analysis Agent | Pattern + root cause  |
| 3    | **suggest** | Fix Suggestion Agent | Fix recommendations   |
| 4    | **learn**   | All Agents           | Knowledge Base update |

---

## 4. Inter-Agent Communication

### Communication Matrix

```
                    Error Analysis    Fix Suggestion    Runtime Monitoring    Incident Response
Error Analysis      ─                 PASS              ─                     PASS (critical)
Fix Suggestion      ─                 ─                 ─                     PASS (fix ready)
Runtime Monitoring  ─                 ─                 ─                     PASS (alerts)
Incident Response   QUERY             QUERY             QUERY                 ─
Knowledge Base      READ/WRITE        READ/WRITE        READ/WRITE            READ/WRITE
```

### Communication Channels

```
┌─────────────────────────────────────────────────────────────────────────┐
│                     INTER-AGENT MESSAGES                                │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  Error Analysis ──────▶ Fix Suggestion                                  │
│  Payload: { analysisResults, errorContext, severity, pattern }          │
│                                                                         │
│  Error Analysis ──────▶ Incident Response                               │
│  Payload: { criticalErrors, rootCause, affectedServices, correlationId }│
│                                                                         │
│  Runtime Monitoring ──▶ Incident Response                               │
│  Payload: { alertType, metrics, threshold, currentValue, trend }        │
│                                                                         │
│  Runtime Monitoring ──▶ Auto Recovery                                   │
│  Payload: { recoveryTrigger, action, target, parameters }               │
│                                                                         │
│  Fix Suggestion ──────▶ Incident Response                               │
│  Payload: { fixId, patch, confidence, riskLevel }                       │
│                                                                         │
│  All Agents ──────────▶ Knowledge Base (READ/WRITE)                     │
│  Payload: { type, data, metadata, timestamp }                           │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Message Format

```typescript
interface AgentMessage {
  messageId: string;
  timestamp: string;
  source: AgentType;
  target: AgentType | 'KnowledgeBase';
  type: MessageType;
  priority: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  payload: Record<string, unknown>;
  correlationId?: string;
  traceId?: string;
}
```

---

## 5. Priorities

### Priority Matrix

```
┌──────────┬─────────────────────┬──────────────────┬────────────────────────────┐
│ Priority │ Agent               │ Response Time    │ Action                     │
├──────────┼─────────────────────┼──────────────────┼────────────────────────────┤
│ CRITICAL │ Incident Response   │ Immediate        │ Alert, escalate, mitigate  │
│ HIGH     │ Error Analysis      │ Within 30s       │ Analyze, classify, diagnose│
│ MEDIUM   │ Fix Suggestion      │ Within 5min      │ Generate fixes, patches    │
│ LOW      │ Runtime Monitoring  │ Continuous       │ Batch alerts, background   │
└──────────┴─────────────────────┴──────────────────┴────────────────────────────┘
```

### Priority Queue Processing

```
┌─────────────────────────────────────────────────────────────────┐
│                    PRIORITY QUEUE                               │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  [CRITICAL] ──────────────────────────────────────────────────┐ │
│    - System down                                               │ │
│    - Data corruption                                           │ │
│    - Security breach                                           │ │
│    - OOM imminent                                              │ │
│                                                                 │ │
│  [HIGH] ──────────────────────────────────────────────────────┤ │
│    - Error rate spike                                          │ │
│    - Response time degradation                                 │ │
│    - Connection pool exhaustion                                │ │
│    - Deadlock detected                                         │ │
│                                                                 │ │
│  [MEDIUM] ────────────────────────────────────────────────────┤ │
│    - Recurring errors                                          │ │
│    - Memory leak detected                                      │ │
│    - Queue backlog growing                                     │ │
│    - Redis eviction rate increasing                            │ │
│                                                                 │ │
│  [LOW] ───────────────────────────────────────────────────────┤ │
│    - Baseline drift                                            │ │
│    - Minor performance regression                              │ │
│    - Log pattern change                                        │ │
│    - Configuration drift                                       │ │
│                                                                 │ │
└─────────────────────────────────────────────────────────────────┘
```

---

## 6. Memory System

### Knowledge Base Schema

```
┌─────────────────────────────────────────────────────────────────────────┐
│                         KNOWLEDGE BASE                                  │
├──────────────┬──────────────────────────────────────────────────────────┤
│ Errors       │ errorId, signature, stackTrace, severity, frequency,     │
│              │ firstSeen, lastSeen, resolved, relatedFixes              │
├──────────────┼──────────────────────────────────────────────────────────┤
│ Fixes        │ fixId, errorId, patch, explanation, confidence,          │
│              │ applied, success, rollback                               │
├──────────────┼──────────────────────────────────────────────────────────┤
│ Patterns     │ patternId, signature, description, category,             │
│              │ frequency, severity, relatedErrors                       │
├──────────────┼──────────────────────────────────────────────────────────┤
│ Incidents    │ incidentId, title, severity, status, timeline,           │
│              │ affectedServices, resolution, duration                   │
├──────────────┼──────────────────────────────────────────────────────────┤
│ Solutions    │ solutionId, patternId, fixId, effectiveness,             │
│              │ appliedCount, successRate, lastApplied                   │
└──────────────┴──────────────────────────────────────────────────────────┘
```

### Learning Cycle

```
┌─────────────────────────────────────────────────────────────────┐
│                    LEARNING CYCLE                               │
│                                                                 │
│  ┌──────────┐     ┌──────────┐     ┌──────────┐     ┌────────┐ │
│  │  Error   │────▶│  Fix     │────▶│  Apply   │────▶│ Store  │ │
│  │ Detected │     │Generated │     │  Fix     │     │ Result │ │
│  └──────────┘     └──────────┘     └──────────┘     └────────┘ │
│       ▲                                                  │      │
│       │                                                  ▼      │
│       │                                          ┌──────────┐  │
│       │                                          │  Update  │  │
│       │◀─────────────────────────────────────────│ Pattern  │  │
│       │                                          │  DB      │  │
│       │                                          └──────────┘  │
│       │                                                │       │
│       │                                                ▼       │
│       │                                          ┌──────────┐  │
│       └──────────────────────────────────────────│ Improve  │  │
│                                                  │Detection │  │
│                                                  └──────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### Similar Error Detection

```typescript
interface SimilarErrorSearch {
  query: {
    stackTraceSignature: string;
    errorMessage: string;
    serviceName: string;
    timeWindow: string;
  };
  results: Array<{
    errorId: string;
    similarity: number;
    pattern: string;
    previousFix?: string;
    successRate: number;
  }>;
}
```

**Example:**

```
Query: "TypeError: Cannot read properties of undefined (reading 'map')"
Results:
  - err-20260518-042 (similarity: 0.95) - Fixed by: null check before map
  - err-20260515-118 (similarity: 0.87) - Fixed by: optional chaining
  - err-20260510-003 (similarity: 0.72) - Fixed by: API response validation
```

---

## 7. Pipelines

### 7.1 Error Processing Pipeline

```
┌─────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
│  Raw    │───▶│  Parse   │───▶│ Normalize │───▶│ Enrich   │───▶│  Store   │
│  Error  │    │  &       │    │  &        │    │  with    │    │  in      │
│  Event  │    │  Filter  │    │  Dedup    │    │  Context │    │  KB      │
└─────────┘    └──────────┘    └───────────┘    └──────────┘    └──────────┘
                  │                                   │
                  ▼                                   ▼
            Winston/Loki                       Jaeger/Prometheus
            Log aggregation                    Metrics & Traces
```

**Pipeline Stages:**

| Stage               | Description                                             | Output           |
| ------------------- | ------------------------------------------------------- | ---------------- |
| Raw Error Event     | Winston log entry, uncaught exception, rejected promise | Raw error object |
| Parse & Filter      | Extract stack trace, filter noise, remove duplicates    | Parsed error     |
| Normalize & Dedup   | Standardize format, check KB for similar errors         | Normalized error |
| Enrich with Context | Add correlation ID, service info, metrics, traces       | Enriched error   |
| Store in KB         | Persist to Knowledge Base, update patterns              | Stored record    |

### 7.2 Diagnostic Pipeline

```
┌──────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐    ┌──────────┐
│ Collect  │───▶│ Correlate│───▶│ Analyze   │───▶│ Diagnose │───▶│ Recommend│
│ Data     │    │ Events   │    │ Patterns  │    │ RootCause│    │ Fixes    │
└──────────┘    └──────────┘    └───────────┘    └──────────┘    └──────────┘
     │               │               │                │                │
     ▼               ▼               ▼                ▼                ▼
  Logs,          Timeline        Pattern          Root cause       Fix patches,
  Metrics,       construction    matching         identification   config changes
  Traces
```

### 7.3 Report Generation Pipeline

```
┌──────────────┐    ┌──────────┐    ┌───────────┐    ┌──────────────┐
│  Data        │───▶│ Analyze  │───▶│ Generate  │───▶│ Distribute   │
│  Collection  │    │ &        │    │ Report    │    │ Report       │
│              │    │ Aggregate│    │           │    │              │
└──────────────┘    └──────────┘    └───────────┘    └──────────────┘
       │                  │                │                  │
       ▼                  ▼                ▼                  ▼
  KB queries,        Summary stats,   HTML, PDF,       Email, Slack,
  metric aggregation  trends, charts  Markdown         Dashboard
```

---

## 8. Tools Used

### Technology Stack

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        OBSERVABILITY STACK                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   Winston    │  │OpenTelemetry │  │  Prometheus  │                  │
│  │  (Logging)   │  │   (Tracing)  │  │  (Metrics)   │                  │
│  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘                  │
│         │                 │                 │                           │
│         ▼                 ▼                 ▼                           │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │     Loki     │  │    Jaeger    │  │   Grafana    │                  │
│  │ (Log Aggreg.)│  │(Dist. Tracing│  │ (Dashboard)  │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
├─────────────────────────────────────────────────────────────────────────┤
│                        INFRASTRUCTURE                                   │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                  │
│  │   BullMQ     │  │    Prisma    │  │    Redis     │                  │
│  │ (Job Queues) │  │   (ORM/DB)   │  │   (Cache)    │                  │
│  └──────────────┘  └──────────────┘  └──────────────┘                  │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Tool Responsibilities

| Tool              | Purpose                                  | Used By                            |
| ----------------- | ---------------------------------------- | ---------------------------------- |
| **Winston**       | Structured application logging           | All agents, Error Collector        |
| **OpenTelemetry** | Distributed tracing, context propagation | Error Analysis, Runtime Monitoring |
| **Prometheus**    | Metrics collection, alerting rules       | Runtime Monitoring Agent           |
| **Loki**          | Log aggregation, log querying            | Error Analysis Agent               |
| **Jaeger**        | Distributed trace visualization          | Error Analysis Agent               |
| **BullMQ**        | Job queue management, async processing   | Runtime Monitoring, Auto Recovery  |
| **Prisma**        | Database ORM, query optimization         | All agents (Knowledge Base)        |

---

## 9. Observability Integration

### How Agents Use Observability Data

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    OBSERVABILITY DATA FLOW                              │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         METRICS (Prometheus)                     │   │
│  │  - CPU, Memory, GC stats                                        │   │
│  │  - Request rate, latency percentiles                            │   │
│  │  - Error rate, saturation levels                                │   │
│  │  Used by: Runtime Monitoring Agent (continuous analysis)         │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                         LOGS (Winston -> Loki)                   │   │
│  │  - Application events, errors, warnings                         │   │
│  │  - Structured JSON with correlation IDs                         │   │
│  │  - Service metadata, request context                            │   │
│  │  Used by: Error Analysis Agent (pattern detection)               │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
│  ┌─────────────────────────────────────────────────────────────────┐   │
│  │                      TRACES (OpenTelemetry -> Jaeger)            │   │
│  │  - Request flow across services                                 │   │
│  │  - Span timing, attributes, events                              │   │
│  │  - Error spans with stack traces                                │   │
│  │  Used by: Error Analysis Agent (root cause analysis)             │   │
│  └─────────────────────────────────────────────────────────────────┘   │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Correlation ID Propagation

```
┌─────────────────────────────────────────────────────────────────────────┐
│                  CORRELATION ID PROPAGATION                             │
│                                                                         │
│  Client Request                                                         │
│       │                                                                 │
│       │  X-Correlation-ID: corr-abc-123                                 │
│       ▼                                                                 │
│  ┌──────────────┐     ┌──────────────┐     ┌──────────────┐            │
│  │ API Gateway  │────▶│ User Service │────▶│ Order Service│            │
│  │              │     │              │     │              │            │
│  │ traceId: t1  │     │ traceId: t1  │     │ traceId: t1  │            │
│  │ spanId: s1   │     │ spanId: s2   │     │ spanId: s3   │            │
│  │ corrId: abc  │     │ corrId: abc  │     │ corrId: abc  │            │
│  └──────────────┘     └──────┬───────┘     └──────┬───────┘            │
│                              │                    │                     │
│                              ▼                    ▼                     │
│                        ┌──────────────┐     ┌──────────────┐           │
│                        │ DB (Prisma)  │     │ Redis Cache  │           │
│                        │ traceId: t1  │     │ traceId: t1  │           │
│                        │ corrId: abc  │     │ corrId: abc  │           │
│                        └──────────────┘     └──────────────┘           │
│                                                                         │
│  All logs, metrics, and traces include:                                 │
│    - correlationId: Links all events for a single request               │
│    - traceId: OpenTelemetry trace identifier                            │
│    - spanId: Current span within the trace                              │
│                                                                         │
│  Agents use correlationId to:                                           │
│    - Correlate errors across services                                   │
│    - Reconstruct request flow for debugging                             │
│    - Group related incidents                                            │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

**Example Correlated Log Entry:**

```json
{
  "timestamp": "2026-05-21T10:15:32.123Z",
  "level": "error",
  "message": "Database connection timeout",
  "correlationId": "corr-abc-123",
  "traceId": "0af7651916cd43dd8448eb211c80319c",
  "spanId": "b7ad6b7169203331",
  "service": "order-service",
  "error": {
    "type": "ConnectionTimeoutError",
    "stack": "at acquireConnection (src/db/connection.ts:142:15)"
  },
  "context": {
    "userId": "user-456",
    "endpoint": "POST /api/orders",
    "duration": 30000
  }
}
```

---

## 10. Incident Flow

```
┌────────────┐    ┌───────────┐    ┌──────────┐    ┌───────────┐    ┌──────────┐
│ Detection  │───▶│ Analysis  │───▶│ Response │───▶│Resolution │───▶│ Learning │
└────────────┘    └───────────┘    └──────────┘    └───────────┘    └──────────┘
      │                │                │                │                │
      ▼                ▼                ▼                ▼                ▼
  Auto-detected   Root cause      Mitigation      Fix applied      KB updated
  or reported     identified      actions taken   verified         Pattern stored
```

### Incident Flow Details

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        INCIDENT FLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. DETECTION                                                           │
│     ├─ Error Collector captures error                                   │
│     ├─ Runtime Monitoring detects anomaly                               │
│     └─ External alert received                                          │
│                                                                         │
│  2. ANALYSIS                                                            │
│     ├─ Error Analysis Agent classifies severity                         │
│     ├─ Root cause identified through trace correlation                  │
│     ├─ Affected services determined                                     │
│     └─ Similar errors searched in Knowledge Base                        │
│                                                                         │
│  3. RESPONSE                                                            │
│     ├─ Incident Response Agent creates incident                         │
│     ├─ Alerts sent to appropriate channels                              │
│     ├─ Fix Suggestion Agent generates patches                           │
│     └─ Auto-recovery triggered if applicable                            │
│                                                                         │
│  4. RESOLUTION                                                          │
│     ├─ Fix applied and verified                                         │
│     ├─ Service health confirmed                                         │
│     ├─ Incident status updated to resolved                              │
│     └─ Post-mortem report generated                                     │
│                                                                         │
│  5. LEARNING                                                            │
│     ├─ Fix effectiveness recorded in Knowledge Base                     │
│     ├─ Pattern database updated                                         │
│     ├─ Detection rules refined                                          │
│     └─ Response playbook updated                                        │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Incident State Machine

```
                    ┌──────────┐
                    │  NEW     │
                    └────┬─────┘
                         │
                         ▼
                    ┌──────────┐
              ┌─────│INVESTIGAT│─────┐
              │     └────┬─────┘     │
              │          │           │
              ▼          ▼           ▼
         ┌─────────┐ ┌──────────┐ ┌──────────┐
         │ESCALATED│ │MITIGATING│ │  ACK'D   │
         └────┬────┘ └────┬─────┘ └────┬─────┘
              │           │            │
              ▼           ▼            ▼
         ┌─────────────────────────────────┐
         │          RESOLVED               │
         └────────────────┬────────────────┘
                          │
                          ▼
                   ┌─────────────┐
                   │ POST-MORTEM │
                   └─────────────┘
```

---

## 11. Analysis Flow

```
┌─────────────┐    ┌────────────────┐    ┌──────────────┐    ┌──────────────┐
│ Collection  │───▶│ Pattern Detect │───▶│ Root Cause   │───▶│ Fix Suggest  │
└─────────────┘    └────────────────┘    └──────────────┘    └──────────────┘
      │                    │                    │                    │
      ▼                    ▼                    ▼                    ▼
  Logs, traces,       Signature           Causal chain         Code patches,
  metrics, errors     matching,           analysis,            config changes,
  from all sources    clustering          dependency map       best practices
```

### Analysis Flow Details

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        ANALYSIS FLOW                                    │
├─────────────────────────────────────────────────────────────────────────┤
│                                                                         │
│  1. COLLECTION                                                          │
│     ├─ Gather logs from Loki/Winston                                    │
│     ├─ Collect traces from Jaeger/OpenTelemetry                         │
│     ├─ Pull metrics from Prometheus                                     │
│     └─ Query Knowledge Base for historical context                      │
│                                                                         │
│  2. PATTERN DETECTION                                                   │
│     ├─ Generate error signatures from stack traces                      │
│     ├─ Cluster similar errors by signature                              │
│     ├─ Identify temporal patterns (time-based clustering)               │
│     ├─ Detect error cascades across services                            │
│     └─ Match against known patterns in Knowledge Base                   │
│                                                                         │
│  3. ROOT CAUSE ANALYSIS                                                 │
│     ├─ Trace error propagation path                                     │
│     ├─ Identify originating service and call                            │
│     ├─ Analyze dependency graph for failure points                      │
│     ├─ Correlate with metric anomalies                                  │
│     └─ Determine primary vs secondary failures                          │
│                                                                         │
│  4. FIX SUGGESTION                                                      │
│     ├─ Search KB for similar resolved errors                            │
│     ├─ Generate code patches for application errors                     │
│     ├─ Suggest configuration changes for infrastructure issues          │
│     ├─ Propose architectural improvements                               │
│     └─ Provide rollback strategies                                      │
│                                                                         │
└─────────────────────────────────────────────────────────────────────────┘
```

### Pattern Detection Example

```
Input Errors (last 1 hour):
  - 47x "Connection timeout" in user-service
  - 32x "Connection timeout" in order-service
  - 15x "Connection timeout" in payment-service
  - 12x "ECONNREFUSED 127.0.0.1:5432"

Pattern Detected:
  Pattern: DatabaseConnectionFailure
  Root: PostgreSQL connection pool exhaustion
  Origin: user-service (first occurrence)
  Cascade: user-service -> order-service -> payment-service

Confidence: 0.94
```

---

## 12. Reporting Flow

```
┌────────────────┐    ┌────────────────┐    ┌──────────────────┐    ┌────────────────┐
│ Data           │───▶│ Analysis &     │───▶│ Report           │───▶│ Distribution   │
│ Collection     │    │ Aggregation    │    │ Generation       │    │                │
└────────────────┘    └────────────────┘    └──────────────────┘    └────────────────┘
       │                       │                       │                      │
       ▼                       ▼                       ▼                      ▼
  KB queries,             Summary stats,           HTML, PDF,              Email, Slack,
  metric aggregation       trends, charts           Markdown                Dashboard
```

### Report Types

```
┌─────────────────────────────────────────────────────────────────────────┐
│                        REPORT TYPES                                     │
├──────────────────────────┬──────────────────┬───────────────────────────┤
│ Report Type              │ Frequency        │ Audience                  │
├──────────────────────────┼──────────────────┼───────────────────────────┤
│ Incident Report          │ Per incident     │ Engineering, Management   │
│ Error Summary            │ Daily            │ Engineering               │
│ System Health            │ Hourly/Daily     │ Operations, SRE           │
│ Performance Analysis     │ Weekly           │ Engineering, Architecture │
│ Trend Analysis           │ Weekly/Monthly   │ Management, Engineering   │
│ Post-Mortem              │ Per major incident│ All stakeholders         │
│ Knowledge Base Update    │ Continuous       │ All agents                │
└──────────────────────────┴──────────────────┴───────────────────────────┘
```

### Report Generation Pipeline

```
┌─────────────────────────────────────────────────────────────────────────┐
│                    REPORT GENERATION PIPELINE                           │
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐    ┌──────────────┐              │
│  │  Query KB    │───▶│  Aggregate   │───▶│  Format      │              │
│  │  & Metrics   │    │  & Analyze   │    │  & Render    │              │
│  └──────────────┘    └──────────────┘    └──────────────┘              │
│        │                   │                   │                        │
│        ▼                   ▼                   ▼                        │
│  - Incidents         - Statistics         - HTML template               │
│  - Error counts      - Trends             - PDF generation              │
│  - Fix success rates - Correlations       - Markdown output             │
│  - MTTR/MTBF         - Anomalies          - JSON API                    │
│                                                                         │
│  ┌──────────────┐    ┌──────────────┐                                  │
│  │  Distribute  │◀───│  Review &    │                                  │
│  │  Report      │    │  Approve     │                                  │
│  └──────────────┘    └──────────────┘                                  │
│        │                                                              │
│        ▼                                                              │
│  - Email to stakeholders                                              │
│  - Slack notification                                                 │
│  - Dashboard update                                                   │
│  - Archive in KB                                                      │
└─────────────────────────────────────────────────────────────────────────┘
```

### Example Incident Report

```markdown
# Incident Report: INC-20260521-001

## Summary

Database connection pool exhaustion caused cascading failures across
user-service, order-service, and payment-service from 10:14 to 10:47 UTC.

## Impact

- Duration: 33 minutes
- Affected Services: 3
- Failed Requests: 1,247
- Error Rate Peak: 89%

## Timeline

| Time (UTC) | Event                             |
| ---------- | --------------------------------- |
| 10:14:00   | Connection pool usage exceeds 80% |
| 10:14:30   | Slow query detected (5.2s)        |
| 10:15:00   | Connection pool at 100%           |
| 10:15:32   | First connection timeout error    |
| 10:15:35   | Incident auto-created             |
| 10:18:00   | Root cause identified             |
| 10:22:00   | Fix deployed (connection cleanup) |
| 10:30:00   | Error rate declining              |
| 10:47:00   | All services recovered            |

## Root Cause

Unclosed database connections in error paths within user-service
caused connection pool exhaustion.

## Resolution

Applied fix: Ensure connection release in finally blocks
Commit: abc123def

## Lessons Learned

- Add connection pool monitoring alerts at 70% threshold
- Implement connection timeout with automatic cleanup
- Add integration test for error path connection handling
```

---

## Appendix A: Complete System Architecture

```
┌─────────────────────────────────────────────────────────────────────────────────────────┐
│                              MULTI-AGENT IA SYSTEM                                      │
├─────────────────────────────────────────────────────────────────────────────────────────┤
│                                                                                         │
│   ┌─────────────┐                                                                       │
│   │   Clients   │                                                                       │
│   └──────┬──────┘                                                                       │
│          │ X-Correlation-ID                                                             │
│          ▼                                                                              │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│   │                              APPLICATION LAYER                                    │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│   │  │ API Gateway  │  │ User Service │  │Order Service │  │Payment Svc   │         │  │
│   │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │  │
│   │         │                 │                 │                 │                  │  │
│   │         └─────────────────┴─────────────────┴─────────────────┘                  │  │
│   │                                   │                                              │  │
│   │                    ┌──────────────┴──────────────┐                               │  │
│   │                    ▼                             ▼                               │  │
│   │            ┌──────────────┐            ┌──────────────┐                          │  │
│   │            │   Prisma     │            │    Redis     │                          │  │
│   │            │  (PostgreSQL)│            │   (Cache)    │                          │  │
│   │            └──────────────┘            └──────────────┘                          │  │
│   └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│   │                           OBSERVABILITY LAYER                                     │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│   │  │   Winston    │  │OpenTelemetry │  │  Prometheus  │  │    Loki      │         │  │
│   │  │  (Logging)   │  │   (Tracing)  │  │  (Metrics)   │  │ (Log Aggreg) │         │  │
│   │  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘  └──────┬───────┘         │  │
│   │         │                 │                 │                 │                  │  │
│   │         ▼                 ▼                 ▼                 ▼                  │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│   │  │    Jaeger    │  │   Grafana    │  │  AlertManager│  │  LogQL       │         │  │
│   │  │(Dist. Tracing│  │ (Dashboard)  │  │              │  │  Queries     │         │  │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │  │
│   └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│   │                              AGENT LAYER                                          │  │
│   │                                                                                   │  │
│   │  ┌──────────────┐     ┌──────────────────┐     ┌──────────────────┐              │  │
│   │  │    Error     │────▶│  Error Analysis  │────▶│ Fix Suggestion   │              │  │
│   │  │  Collector   │     │     Agent        │     │     Agent        │              │  │
│   │  └──────────────┘     └──────────────────┘     └──────────────────┘              │  │
│   │         │                    │                         │                         │  │
│   │         │                    ▼                         │                         │  │
│   │         │           ┌──────────────────┐               │                         │  │
│   │         │           │    Incident      │◀──────────────┘                         │  │
│   │         │           │  Response Agent  │                                          │  │
│   │         │           └────────┬─────────┘                                          │  │
│   │         │                    │                                                    │  │
│   │         │                    ▼                                                    │  │
│   │         │           ┌──────────────────┐                                          │  │
│   │         │           │   Alert Service  │                                          │  │
│   │         │           └──────────────────┘                                          │  │
│   │         │                                                                         │  │
│   │         ▼                                                                         │  │
│   │  ┌──────────────────┐                                                             │  │
│   │  │  Runtime         │──────────────────────────────────────────┐                  │  │
│   │  │  Monitoring      │──────────────────────────────────────────┤                  │  │
│   │  │  Agent           │──────────────────────────────────────────┤                  │  │
│   │  └────────┬─────────┘                                          │                  │  │
│   │           │                                                    ▼                  │  │
│   │           │                                         ┌──────────────────┐          │  │
│   │           │                                         │  Auto Recovery   │          │  │
│   │           │                                         │     System       │          │  │
│   │           │                                         └──────────────────┘          │  │
│   │           │                                                                       │  │
│   │           └───────────────────────────────────────────────────────────────────┐   │  │
│   │                                                                               ▼   │  │
│   │  ┌──────────────────────────────────────────────────────────────────────────────┐ │  │
│   │  │                           KNOWLEDGE BASE (Prisma)                            │ │  │
│   │  │  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌───────────────────────┐  │ │  │
│   │  │  │ Errors  │ │  Fixes  │ │Patterns │ │Incidents│ │       Solutions       │  │ │  │
│   │  │  └─────────┘ └─────────┘ └─────────┘ └─────────┘ └───────────────────────┘  │ │  │
│   │  └──────────────────────────────────────────────────────────────────────────────┘ │  │
│   │         ▲              ▲              ▲              ▲                             │  │
│   │         └──────────────┴──────────────┴──────────────┘                             │  │
│   │                            All agents read/write                                   │  │
│   └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
│   ┌──────────────────────────────────────────────────────────────────────────────────┐  │
│   │                           EXTERNAL INTEGRATIONS                                   │  │
│   │  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐         │  │
│   │  │    Slack     │  │  PagerDuty   │  │    Email     │  │  Webhooks    │         │  │
│   │  │  (Alerts)    │  │  (Escalation)│  │  (Reports)   │  │  (Custom)    │         │  │
│   │  └──────────────┘  └──────────────┘  └──────────────┘  └──────────────┘         │  │
│   └──────────────────────────────────────────────────────────────────────────────────┘  │
│                                                                                         │
└─────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## Appendix B: Agent Configuration

```typescript
interface AgentConfig {
  errorAnalysis: {
    analysisTimeout: '30s';
    maxStackTraceDepth: 50;
    patternMatchThreshold: 0.75;
    knowledgeBaseQueries: true;
    traceCorrelation: true;
  };
  fixSuggestion: {
    suggestionTimeout: '5min';
    maxPatchSize: 500;
    requireTests: true;
    confidenceThreshold: 0.8;
    autoApplyLowRisk: false;
  };
  runtimeMonitoring: {
    checkInterval: '10s';
    cpuThreshold: 85;
    memoryThreshold: 80;
    responseTimeThreshold: '2s';
    errorRateThreshold: 5;
    autoRecoveryEnabled: true;
  };
  incidentResponse: {
    autoCreateIncident: true;
    alertChannels: ['slack', 'pagerduty', 'email'];
    escalationTimeout: '15min';
    deduplicationWindow: '5min';
    reportGeneration: true;
  };
}
```

---

## Appendix C: Message Flow Example

```
Timeline: Database Connection Pool Exhaustion

10:14:00 - Runtime Monitoring Agent
           └─▶ Detects connection pool at 82%
           └─▶ Logs metric to Prometheus

10:14:30 - Runtime Monitoring Agent
           └─▶ Detects slow query (5.2s)
           └─▶ Sends alert to Incident Response Agent

10:15:00 - Runtime Monitoring Agent
           └─▶ Connection pool at 100%
           └─▶ CRITICAL alert to Incident Response Agent

10:15:32 - Error Collector
           └─▶ Captures first ConnectionTimeoutError
           └─▶ Logs to Winston/Loki with correlationId

10:15:33 - Error Analysis Agent
           └─▶ Receives error from collector
           └─▶ Analyzes stack trace
           └─▶ Queries KB for similar patterns
           └─▶ Identifies: DatabaseConnectionTimeout pattern
           └─▶ Classifies severity: CRITICAL
           └─▶ Sends analysis to Fix Suggestion Agent
           └─▶ Sends critical error to Incident Response Agent

10:15:35 - Incident Response Agent
           └─▶ Creates incident INC-20260521-001
           └─▶ Groups 247 related errors
           └─▶ Generates timeline
           └─▶ Sends alerts to Slack and PagerDuty

10:15:40 - Fix Suggestion Agent
           └─▶ Receives analysis from Error Analysis Agent
           └─▶ Searches KB for similar resolved errors
           └─▶ Generates fix: Add finally block for connection release
           └─▶ Creates patch with 0.92 confidence
           └─▶ Sends fix to Incident Response Agent

10:16:00 - Incident Response Agent
           └─▶ Receives fix suggestion
           └─▶ Updates incident with fix details
           └─▶ Notifies on-call engineer

10:22:00 - Engineer applies fix
           └─▶ Fix deployed to production

10:30:00 - Runtime Monitoring Agent
           └─▶ Detects error rate declining
           └─▶ Connection pool usage normalizing

10:47:00 - Runtime Monitoring Agent
           └─▶ All metrics back to normal
           └─▶ Sends recovery notification

10:47:05 - Incident Response Agent
           └─▶ Updates incident status to RESOLVED
           └─▶ Generates post-mortem report
           └─▶ Triggers learning update to Knowledge Base

10:47:10 - Knowledge Base
           └─▶ Stores fix effectiveness
           └─▶ Updates pattern confidence
           └─✅ Learning cycle complete
```
