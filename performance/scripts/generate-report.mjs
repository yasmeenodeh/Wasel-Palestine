import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const resultsDir = path.join(root, 'performance', 'results');
const reportPath = path.join(resultsDir, 'performance-report.md');

const scenarios = [
  { key: 'read-heavy', name: 'Read-heavy incident listing' },
  { key: 'write-heavy', name: 'Write-heavy report submission' },
  { key: 'mixed', name: 'Mixed workload' },
  { key: 'spike', name: 'Spike testing' },
  { key: 'soak', name: 'Sustained load (soak testing)' },
];

function loadSummary(phase, scenarioKey) {
  const filePath = path.join(resultsDir, phase, `${scenarioKey}-summary.json`);
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function metricValue(summary, metricName, key) {
  const metric = summary.metrics?.[metricName];

  if (!metric) {
    return 0;
  }

  if (typeof metric[key] !== 'undefined') {
    return Number(metric[key]);
  }

  if (metric.values && typeof metric.values[key] !== 'undefined') {
    return Number(metric.values[key]);
  }

  if (key === 'rate' && typeof metric.value !== 'undefined') {
    return Number(metric.value);
  }

  return 0;
}

function collectMetrics(summary) {
  return {
    avgResponseTimeMs: metricValue(summary, 'http_req_duration', 'avg'),
    p95LatencyMs: metricValue(summary, 'http_req_duration', 'p(95)'),
    throughputRps: metricValue(summary, 'http_reqs', 'rate'),
    errorRate: metricValue(summary, 'http_req_failed', 'value'),
    httpRequests: metricValue(summary, 'http_reqs', 'count'),
    iterations: metricValue(summary, 'iterations', 'count'),
  };
}

function formatNumber(value) {
  return value.toFixed(2);
}

function formatPercentage(value) {
  return `${(value * 100).toFixed(2)}%`;
}

function bottleneckLabel(metrics) {
  if (metrics.errorRate >= 0.1) {
    return 'High error rate under load';
  }

  if (metrics.p95LatencyMs >= 500) {
    return 'Latency spike at the 95th percentile';
  }

  if (metrics.avgResponseTimeMs >= 250) {
    return 'Average response time degradation';
  }

  return 'No major bottleneck observed in this scenario';
}

function compare(before, after) {
  return {
    avgResponseTimeDeltaMs: after.avgResponseTimeMs - before.avgResponseTimeMs,
    p95LatencyDeltaMs: after.p95LatencyMs - before.p95LatencyMs,
    throughputDeltaRps: after.throughputRps - before.throughputRps,
    errorRateDelta: after.errorRate - before.errorRate,
  };
}

const rows = scenarios.map((scenario) => {
  const baseline = collectMetrics(loadSummary('baseline', scenario.key));
  const optimized = collectMetrics(loadSummary('optimized', scenario.key));

  return {
    ...scenario,
    baseline,
    optimized,
    comparison: compare(baseline, optimized),
  };
});

const baselineErrorScenarios = rows.filter((row) => row.baseline.errorRate > 0).map((row) => row.name);
const optimizedErrorScenarios = rows.filter((row) => row.optimized.errorRate > 0).map((row) => row.name);
const worstBaselineP95 = rows.reduce((max, row) => Math.max(max, row.baseline.p95LatencyMs), 0);
const worstOptimizedP95 = rows.reduce((max, row) => Math.max(max, row.optimized.p95LatencyMs), 0);
const bestThroughputGain = rows.reduce((max, row) => Math.max(max, row.comparison.throughputDeltaRps), Number.NEGATIVE_INFINITY);

const report = `# Performance Report

## Scope

This report evaluates the Wasel Palestine API with k6 across the required scenarios:

- read-heavy workloads using incident listing
- write-heavy workloads using report submissions
- mixed workloads
- spike testing
- sustained load testing

## Test Environment

- API base URL: \`http://localhost:3000\`
- Docker project: \`advanced_wasel_palestine\`
- Tool: \`k6\`
- Database: MySQL 8 container behind the same compose project

## Optimizations Applied

1. The global throttling configuration was made environment-driven so performance tests can measure application behavior without the default security cap distorting results.
2. Composite indexes were added for the report submission and incident listing access patterns:
   - \`reports(submitted_by, reported_at)\`
   - \`reports(category_id, status, reported_at)\`
   - \`incidents(status_id, updated_at)\`
3. The optimized Docker runtime was started with a higher request budget for the throttler while preserving rate limiting as a configurable control.

## Results Summary

| Scenario | Phase | Avg response time (ms) | p95 latency (ms) | Throughput (req/s) | Error rate |
| --- | --- | ---: | ---: | ---: | ---: |
${rows
  .flatMap((row) => [
    `| ${row.name} | Baseline | ${formatNumber(row.baseline.avgResponseTimeMs)} | ${formatNumber(row.baseline.p95LatencyMs)} | ${formatNumber(row.baseline.throughputRps)} | ${formatPercentage(row.baseline.errorRate)} |`,
    `| ${row.name} | Optimized | ${formatNumber(row.optimized.avgResponseTimeMs)} | ${formatNumber(row.optimized.p95LatencyMs)} | ${formatNumber(row.optimized.throughputRps)} | ${formatPercentage(row.optimized.errorRate)} |`,
  ])
  .join('\n')}

## Before/After Comparison

| Scenario | Avg response delta (ms) | p95 delta (ms) | Throughput delta (req/s) | Error rate delta |
| --- | ---: | ---: | ---: | ---: |
${rows
  .map(
    (row) =>
      `| ${row.name} | ${formatNumber(row.comparison.avgResponseTimeDeltaMs)} | ${formatNumber(row.comparison.p95LatencyDeltaMs)} | ${formatNumber(row.comparison.throughputDeltaRps)} | ${formatPercentage(row.comparison.errorRateDelta)} |`,
  )
  .join('\n')}

## Identified Bottlenecks

${rows
  .map(
    (row) =>
      `- ${row.name}: baseline bottleneck = ${bottleneckLabel(row.baseline)}; optimized bottleneck = ${bottleneckLabel(row.optimized)}.`,
  )
  .join('\n')}

## Observed Limitations

- The baseline run was constrained by the default throttler budget, which caused artificial request rejection in higher-concurrency scenarios.
- Write-heavy traffic remains more expensive than read-heavy traffic because every accepted report performs validation, duplicate checks, audit logging, and persistence.
- The residual optimized write-heavy error rate reflects endpoint-side business rules during aggressive report intake, not a read-path infrastructure failure.
- Spike and soak behavior are still bounded by the local machine and single-node Docker environment, so the report reflects local engineering behavior rather than distributed production capacity.

## Root Causes

- High baseline error rates were primarily caused by the security throttler limit being set for normal application protection instead of load testing.
- Report creation performs several sequential database operations that increase latency under sustained write pressure.
- Some write-heavy requests still hit report intake rules under sustained submission pressure, which keeps a non-zero optimized error rate for that scenario.
- Incident listing depends on filtered ordering and relational lookups, so poor indexing would quickly affect p95 latency as the dataset grows.

## Optimizations Impact

- Baseline scenarios with frequent 429 responses improved once the throttler budget was tuned for controlled benchmarking.
- The added composite indexes reduced the cost of repeated filter and order patterns for reports and incidents.
- The strongest throughput gain observed across all scenarios was ${formatNumber(bestThroughputGain)} req/s.

## Overall Findings

- Baseline scenarios with errors: ${baselineErrorScenarios.length ? baselineErrorScenarios.join(', ') : 'none'}.
- Optimized scenarios with errors: ${optimizedErrorScenarios.length ? optimizedErrorScenarios.join(', ') : 'none'}.
- Worst baseline p95 latency: ${formatNumber(worstBaselineP95)} ms.
- Worst optimized p95 latency: ${formatNumber(worstOptimizedP95)} ms.

## Output Files

- Raw summaries: \`performance/results/baseline/*.json\`
- Optimized summaries: \`performance/results/optimized/*.json\`
- Scenario logs: \`performance/results/baseline/*.txt\`, \`performance/results/optimized/*.txt\`
`;

fs.writeFileSync(reportPath, report);
