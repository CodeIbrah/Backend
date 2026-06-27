import { logger } from '../logging/logger';
import { tracer } from '../telemetry/tracer';
import { Invoice, Receipt, InvoiceStatus } from '../types';
import { invoiceService } from '../services/invoice.service';
import { SpanStatusCode } from '@opentelemetry/api';

// ============================================================
// Types
// ============================================================

export interface InvoiceDoctorResult {
  success: boolean;
  timestamp: string;
  service: string;
  diagnostics: InvoiceDiagnostics;
  errorAnalysis: InvoiceErrorAnalysis;
  performance: InvoicePerformanceReport;
  recommendations: string[];
  duration: number;
}

export interface InvoiceDiagnostics {
  inMemoryStore: InMemoryStoreHealth;
  mailService: ServiceHealth;
  smsService: ServiceHealth;
  jwtConfig: JwtConfigHealth;
  overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
}

export interface InMemoryStoreHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  invoiceCount: number;
  receiptCount: number;
  invoiceCounter: number;
  receiptCounter: number;
  maxCapacity: number;
  utilizationPercent: number;
}

export interface ServiceHealth {
  status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY';
  url: string;
  latency: number;
  error: string | null;
}

export interface JwtConfigHealth {
  status: 'HEALTHY' | 'UNHEALTHY';
  secretConfigured: boolean;
  secretLength: number;
}

export interface InvoiceErrorAnalysis {
  totalErrors: number;
  errorTypes: Record<string, number>;
  criticalErrors: string[];
  recentErrors: Array<{
    message: string;
    timestamp: string;
    severity: string;
  }>;
}

export interface InvoicePerformanceReport {
  invoiceCreationRate: number;
  invoiceCount: number;
  receiptCount: number;
  memoryUsage: {
    rss: string;
    heapTotal: string;
    heapUsed: string;
    heapUtilizationPercent: number;
  };
  uptime: number;
  pendingInvoices: number;
  overdueInvoices: number;
}

// ============================================================
// Invoice Doctor
// ============================================================

export class InvoiceDoctor {
  private readonly mailServiceUrl: string;
  private readonly smsServiceUrl: string;
  private readonly maxInMemoryItems: number;
  private startTime: number = 0;

  constructor() {
    this.mailServiceUrl = process.env.MAIL_SERVICE_URL || 'http://localhost:3007';
    this.smsServiceUrl = process.env.SMS_SERVICE_URL || 'http://localhost:3008';
    this.maxInMemoryItems = 10000;
  }

  async run(): Promise<InvoiceDoctorResult> {
    const span = tracer.startSpan('invoice-doctor.run');
    this.startTime = Date.now();

    try {
      logger.info('Invoice Doctor: Starting comprehensive diagnostic scan');

      const [diagnostics, errorAnalysis, performance] = await Promise.all([
        this.runDiagnostics(),
        this.analyzeErrors(),
        this.reportPerformance(),
      ]);

      const recommendations = this.generateRecommendations(diagnostics, errorAnalysis, performance);
      const duration = Date.now() - this.startTime;

      const result: InvoiceDoctorResult = {
        success: diagnostics.overall !== 'UNHEALTHY',
        timestamp: new Date().toISOString(),
        service: 'invoice-service',
        diagnostics,
        errorAnalysis,
        performance,
        recommendations,
        duration,
      };

      if (result.success) {
        logger.info({
          message: 'Invoice Doctor: Scan completed successfully',
          duration,
          overallHealth: diagnostics.overall,
          recommendationsCount: recommendations.length,
        });
      } else {
        logger.error({
          message: 'Invoice Doctor: Scan completed with issues',
          duration,
          overallHealth: diagnostics.overall,
          recommendationsCount: recommendations.length,
        });
      }

      return result;
    } catch (error) {
      span.recordException(error as Error);
      span.setStatus({ code: SpanStatusCode.ERROR });

      logger.error({ message: 'Invoice Doctor: Scan failed', error });

      return {
        success: false,
        timestamp: new Date().toISOString(),
        service: 'invoice-service',
        diagnostics: {
          inMemoryStore: { status: 'UNHEALTHY', invoiceCount: 0, receiptCount: 0, invoiceCounter: 0, receiptCounter: 0, maxCapacity: this.maxInMemoryItems, utilizationPercent: 0 },
          mailService: { status: 'UNHEALTHY', url: this.mailServiceUrl, latency: 0, error: 'Diagnostic failed' },
          smsService: { status: 'UNHEALTHY', url: this.smsServiceUrl, latency: 0, error: 'Diagnostic failed' },
          jwtConfig: { status: 'UNHEALTHY', secretConfigured: false, secretLength: 0 },
          overall: 'UNHEALTHY',
        },
        errorAnalysis: { totalErrors: 0, errorTypes: {}, criticalErrors: [], recentErrors: [] },
        performance: {
          invoiceCreationRate: 0, invoiceCount: 0, receiptCount: 0,
          memoryUsage: { rss: '0MB', heapTotal: '0MB', heapUsed: '0MB', heapUtilizationPercent: 0 },
          uptime: 0, pendingInvoices: 0, overdueInvoices: 0,
        },
        recommendations: [`Diagnostic scan failed: ${(error as Error).message}`],
        duration: Date.now() - this.startTime,
      };
    } finally {
      span.end();
    }
  }

  // ----------------------------------------------------------
  // Diagnostics
  // ----------------------------------------------------------

  private async runDiagnostics(): Promise<InvoiceDiagnostics> {
    const span = tracer.startSpan('invoice-doctor.diagnostics');

    try {
      const [inMemoryHealth, mailHealth, smsHealth] = await Promise.all([
        this.checkInMemoryStore(),
        this.checkServiceHealth(this.mailServiceUrl, 'mail'),
        this.checkServiceHealth(this.smsServiceUrl, 'sms'),
      ]);

      const jwtHealth = this.checkJwtConfig();

      const services = [inMemoryHealth, mailHealth, smsHealth];
      const unhealthyCount = services.filter((s) => s.status === 'UNHEALTHY').length;
      const degradedCount = services.filter((s) => s.status === 'DEGRADED').length;

      let overall: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
      if (unhealthyCount > 0) overall = 'UNHEALTHY';
      else if (degradedCount > 0) overall = 'DEGRADED';

      return {
        inMemoryStore: inMemoryHealth,
        mailService: mailHealth,
        smsService: smsHealth,
        jwtConfig: jwtHealth,
        overall,
      };
    } finally {
      span.end();
    }
  }

  private checkInMemoryStore(): InMemoryStoreHealth {
    const allInvoices = invoiceService.getAllInvoices();
    const allReceipts = invoiceService.getAllReceipts();
    const totalItems = allInvoices.length + allReceipts.length;
    const utilizationPercent = (totalItems / this.maxInMemoryItems) * 100;

    let status: 'HEALTHY' | 'DEGRADED' | 'UNHEALTHY' = 'HEALTHY';
    if (utilizationPercent > 90) status = 'UNHEALTHY';
    else if (utilizationPercent > 70) status = 'DEGRADED';

    return {
      status,
      invoiceCount: allInvoices.length,
      receiptCount: allReceipts.length,
      invoiceCounter: 2000 + allInvoices.length,
      receiptCounter: 8000 + allReceipts.length,
      maxCapacity: this.maxInMemoryItems,
      utilizationPercent: Math.round(utilizationPercent * 100) / 100,
    };
  }

  private async checkServiceHealth(url: string, name: string): Promise<ServiceHealth> {
    const startTime = Date.now();

    try {
      const healthUrl = url.replace(/\/api\/v1\/\w+$/, '') + '/health';
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 5000);

      const response = await fetch(healthUrl, { signal: controller.signal });
      clearTimeout(timeout);

      const latency = Date.now() - startTime;

      return {
        status: response.ok ? 'HEALTHY' : 'DEGRADED',
        url,
        latency,
        error: response.ok ? null : `HTTP ${response.status}`,
      };
    } catch (error) {
      return {
        status: 'UNHEALTHY',
        url,
        latency: Date.now() - startTime,
        error: (error as Error).message,
      };
    }
  }

  private checkJwtConfig(): JwtConfigHealth {
    const secret = process.env.JWT_SECRET || '';
    return {
      status: secret.length >= 32 ? 'HEALTHY' : 'UNHEALTHY',
      secretConfigured: secret.length > 0,
      secretLength: secret.length,
    };
  }

  // ----------------------------------------------------------
  // Error Analysis
  // ----------------------------------------------------------

  private async analyzeErrors(): Promise<InvoiceErrorAnalysis> {
    const span = tracer.startSpan('invoice-doctor.error-analysis');

    try {
      const allInvoices = invoiceService.getAllInvoices();
      const errorTypes: Record<string, number> = {};

      errorTypes['MissingEmail'] = allInvoices.filter((i) => !i.userEmail).length;
      errorTypes['MissingPhone'] = allInvoices.filter((i) => !i.userPhone).length;
      errorTypes['OverdueInvoices'] = allInvoices.filter((i) => i.status === InvoiceStatus.OVERDUE).length;
      errorTypes['CancelledInvoices'] = allInvoices.filter((i) => i.status === InvoiceStatus.CANCELLED).length;
      errorTypes['ZeroTotal'] = allInvoices.filter((i) => i.total <= 0).length;

      const criticalErrors: string[] = [];
      if (errorTypes['OverdueInvoices'] > 10) {
        criticalErrors.push(`High number of overdue invoices: ${errorTypes['OverdueInvoices']}`);
      }
      if (errorTypes['MissingEmail'] > 5) {
        criticalErrors.push(`${errorTypes['MissingEmail']} invoices missing user email`);
      }

      const totalErrors = Object.values(errorTypes).reduce((a, b) => a + b, 0);

      return {
        totalErrors,
        errorTypes,
        criticalErrors,
        recentErrors: [],
      };
    } finally {
      span.end();
    }
  }

  // ----------------------------------------------------------
  // Performance Report
  // ----------------------------------------------------------

  private async reportPerformance(): Promise<InvoicePerformanceReport> {
    const span = tracer.startSpan('invoice-doctor.performance');

    try {
      const allInvoices = invoiceService.getAllInvoices();
      const allReceipts = invoiceService.getAllReceipts();
      const memUsage = process.memoryUsage();
      const uptime = process.uptime();

      return {
        invoiceCreationRate: uptime > 0 ? Math.round((allInvoices.length / uptime) * 3600) : 0,
        invoiceCount: allInvoices.length,
        receiptCount: allReceipts.length,
        memoryUsage: {
          rss: `${(memUsage.rss / 1024 / 1024).toFixed(2)}MB`,
          heapTotal: `${(memUsage.heapTotal / 1024 / 1024).toFixed(2)}MB`,
          heapUsed: `${(memUsage.heapUsed / 1024 / 1024).toFixed(2)}MB`,
          heapUtilizationPercent: Math.round((memUsage.heapUsed / memUsage.heapTotal) * 10000) / 100,
        },
        uptime: Math.round(uptime),
        pendingInvoices: allInvoices.filter((i) => i.status === InvoiceStatus.ISSUED).length,
        overdueInvoices: allInvoices.filter((i) => i.status === InvoiceStatus.OVERDUE).length,
      };
    } finally {
      span.end();
    }
  }

  // ----------------------------------------------------------
  // Recommendations
  // ----------------------------------------------------------

  private generateRecommendations(
    diagnostics: InvoiceDiagnostics,
    _errorAnalysis: InvoiceErrorAnalysis,
    performance: InvoicePerformanceReport
  ): string[] {
    const recommendations: string[] = [];

    // In-memory store warnings
    if (diagnostics.inMemoryStore.status === 'UNHEALTHY') {
      recommendations.push(
        `CRITICAL: In-memory store at ${diagnostics.inMemoryStore.utilizationPercent}% capacity (${diagnostics.inMemoryStore.invoiceCount + diagnostics.inMemoryStore.receiptCount}/${diagnostics.inMemoryStore.maxCapacity}). Data will be lost on restart. Migrate to persistent storage (PostgreSQL) immediately.`
      );
    } else if (diagnostics.inMemoryStore.status === 'DEGRADED') {
      recommendations.push(
        `WARNING: In-memory store at ${diagnostics.inMemoryStore.utilizationPercent}% capacity. Consider migrating to persistent storage (PostgreSQL) soon.`
      );
    } else {
      recommendations.push(
        'INFO: In-memory store is temporary. For production, migrate to PostgreSQL via Prisma (see users-service pattern).'
      );
    }

    // Service health warnings
    if (diagnostics.mailService.status === 'UNHEALTHY') {
      recommendations.push(
        `CRITICAL: Mail service unreachable at ${diagnostics.mailService.url}. Invoice emails will fail. Ensure mail-service is running.`
      );
    }
    if (diagnostics.smsService.status === 'UNHEALTHY') {
      recommendations.push(
        `WARNING: SMS service unreachable at ${diagnostics.smsService.url}. SMS notifications will fail. Ensure sms-service is running.`
      );
    }

    // JWT warnings
    if (!diagnostics.jwtConfig.secretConfigured) {
      recommendations.push(
        'CRITICAL: JWT_SECRET not configured. Authentication will fail.'
      );
    } else if (diagnostics.jwtConfig.secretLength < 32) {
      recommendations.push(
        `WARNING: JWT_SECRET is only ${diagnostics.jwtConfig.secretLength} characters. Use at least 32 characters for production.`
      );
    }

    // Performance
    if (performance.memoryUsage.heapUtilizationPercent > 80) {
      recommendations.push(
        `WARNING: Heap utilization at ${performance.memoryUsage.heapUtilizationPercent}%. Monitor for memory leaks.`
      );
    }
    if (performance.overdueInvoices > 0) {
      recommendations.push(
        `INFO: ${performance.overdueInvoices} overdue invoices found. Consider implementing automated reminders.`
      );
    }

    if (recommendations.length === 0) {
      recommendations.push('All systems operating normally for invoice-service.');
    }

    return recommendations;
  }
}

export const invoiceDoctor = new InvoiceDoctor();
