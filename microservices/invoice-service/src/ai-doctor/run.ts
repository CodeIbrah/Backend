#!/usr/bin/env ts-node

import { invoiceDoctor } from './invoice-doctor';
import * as fs from 'fs';
import * as path from 'path';

async function main() {
  console.log('');
  console.log('='.repeat(70));
  console.log('  AI DOCTOR - Invoice Service Diagnostic Scan');
  console.log('='.repeat(70));
  console.log('');

  console.log('Running comprehensive diagnostic scan...\n');

  const result = await invoiceDoctor.run();

  // ---- DIAGNOSTICS ----
  console.log('[DIAGNOSTICS]');
  console.log('-'.repeat(70));
  console.log(`  Overall Health:     ${formatStatus(result.diagnostics.overall)}`);
  console.log('');

  console.log(`  In-Memory Store:`);
  console.log(`    Status:           ${formatStatus(result.diagnostics.inMemoryStore.status)}`);
  console.log(`    Invoices:         ${result.diagnostics.inMemoryStore.invoiceCount}`);
  console.log(`    Receipts:         ${result.diagnostics.inMemoryStore.receiptCount}`);
  console.log(`    Utilization:      ${result.diagnostics.inMemoryStore.utilizationPercent}%`);
  console.log(`    Max Capacity:     ${result.diagnostics.inMemoryStore.maxCapacity}`);
  console.log('');

  console.log(`  Mail Service:`);
  console.log(`    Status:           ${formatStatus(result.diagnostics.mailService.status)}`);
  console.log(`    URL:              ${result.diagnostics.mailService.url}`);
  console.log(`    Latency:          ${result.diagnostics.mailService.latency}ms`);
  if (result.diagnostics.mailService.error) {
    console.log(`    Error:            ${result.diagnostics.mailService.error}`);
  }
  console.log('');

  console.log(`  SMS Service:`);
  console.log(`    Status:           ${formatStatus(result.diagnostics.smsService.status)}`);
  console.log(`    URL:              ${result.diagnostics.smsService.url}`);
  console.log(`    Latency:          ${result.diagnostics.smsService.latency}ms`);
  if (result.diagnostics.smsService.error) {
    console.log(`    Error:            ${result.diagnostics.smsService.error}`);
  }
  console.log('');

  console.log(`  JWT Configuration:`);
  console.log(`    Status:           ${formatStatus(result.diagnostics.jwtConfig.status)}`);
  console.log(`    Secret Configured: ${result.diagnostics.jwtConfig.secretConfigured}`);
  console.log(`    Secret Length:    ${result.diagnostics.jwtConfig.secretLength} chars`);
  console.log('');

  // ---- ERROR ANALYSIS ----
  console.log('[ERROR ANALYSIS]');
  console.log('-'.repeat(70));
  console.log(`  Total Issues:       ${result.errorAnalysis.totalErrors}`);
  console.log('');
  for (const [type, count] of Object.entries(result.errorAnalysis.errorTypes)) {
    console.log(`  ${type}: ${count}`);
  }
  console.log('');
  if (result.errorAnalysis.criticalErrors.length > 0) {
    console.log('  Critical Alerts:');
    for (const err of result.errorAnalysis.criticalErrors) {
      console.log(`    ⚠ ${err}`);
    }
    console.log('');
  }

  // ---- PERFORMANCE ----
  console.log('[PERFORMANCE]');
  console.log('-'.repeat(70));
  console.log(`  Invoice Creation Rate: ${result.performance.invoiceCreationRate}/hour`);
  console.log(`  Total Invoices:        ${result.performance.invoiceCount}`);
  console.log(`  Total Receipts:        ${result.performance.receiptCount}`);
  console.log(`  Pending (Issued):      ${result.performance.pendingInvoices}`);
  console.log(`  Overdue:               ${result.performance.overdueInvoices}`);
  console.log('');

  console.log(`  Memory Usage:`);
  console.log(`    RSS:                 ${result.performance.memoryUsage.rss}`);
  console.log(`    Heap Total:          ${result.performance.memoryUsage.heapTotal}`);
  console.log(`    Heap Used:           ${result.performance.memoryUsage.heapUsed}`);
  console.log(`    Heap Utilization:    ${result.performance.memoryUsage.heapUtilizationPercent}%`);
  console.log(`  Uptime:                ${formatUptime(result.performance.uptime)}`);
  console.log('');

  // ---- RECOMMENDATIONS ----
  console.log('[RECOMMENDATIONS]');
  console.log('-'.repeat(70));
  if (result.recommendations.length === 0) {
    console.log('  ✓ All systems operating normally.');
  } else {
    for (let i = 0; i < result.recommendations.length; i++) {
      console.log(`  ${i + 1}. ${result.recommendations[i]}`);
    }
  }
  console.log('');

  // ---- SUMMARY ----
  console.log('='.repeat(70));
  console.log(`  Scan Duration: ${result.duration}ms`);
  console.log(`  Result: ${result.success ? '✓ PASSED' : '✗ ISSUES FOUND'}`);
  console.log('='.repeat(70));

  // ---- SAVE REPORT ----
  const reportsDir = path.resolve(__dirname, '../../../../reports');
  if (!fs.existsSync(reportsDir)) {
    fs.mkdirSync(reportsDir, { recursive: true });
  }
  const reportPath = path.join(reportsDir, `invoice-doctor-${Date.now()}.json`);
  fs.writeFileSync(reportPath, JSON.stringify(result, null, 2));
  console.log(`\nReport saved to: reports/${path.basename(reportPath)}\n`);

  process.exit(result.success ? 0 : 1);
}

function formatStatus(status: string): string {
  const icons: Record<string, string> = {
    HEALTHY: '✓ HEALTHY',
    DEGRADED: '⚠ DEGRADED',
    UNHEALTHY: '✗ UNHEALTHY',
  };
  return icons[status] || status;
}

function formatUptime(seconds: number): string {
  const d = Math.floor(seconds / 86400);
  const h = Math.floor((seconds % 86400) / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  const s = Math.floor(seconds % 60);
  const parts: string[] = [];
  if (d > 0) parts.push(`${d}d`);
  if (h > 0) parts.push(`${h}h`);
  if (m > 0) parts.push(`${m}m`);
  parts.push(`${s}s`);
  return parts.join(' ');
}

main().catch((err) => {
  console.error('Invoice Doctor failed:', err);
  process.exit(1);
});
