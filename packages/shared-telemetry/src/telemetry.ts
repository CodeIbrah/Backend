import { NodeSDK } from '@opentelemetry/sdk-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-http';
import { PrometheusExporter } from '@opentelemetry/exporter-prometheus';
import { HttpInstrumentation } from '@opentelemetry/instrumentation-http';
import { ExpressInstrumentation } from '@opentelemetry/instrumentation-express';
import { Resource } from '@opentelemetry/resources';
import { SemanticResourceAttributes } from '@opentelemetry/semantic-conventions';
import { trace, Tracer, metrics, diag, DiagConsoleLogger, DiagLogLevel } from '@opentelemetry/api';
import { Registry, Histogram, Counter, Gauge, registerCollector } from 'prom-client';
import { PrometheusSerializer } from '@opentelemetry/exporter-prometheus';

let sdk: NodeSDK | null = null;
let promExporter: PrometheusExporter | null = null;
let metricsRegistry: Registry | null = null;
let initialized = false;

const httpDurationHistogram: { [key: string]: Histogram } = {};
const serviceCallHistogram: { [key: string]: Histogram } = {};

export function initializeTelemetry(serviceName?: string): void {
  if (initialized) {
    return;
  }

  const name = serviceName || process.env.OTEL_SERVICE_NAME || 'backend-service';
  const otlpEndpoint = process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://localhost:4318';

  diag.setLogger(new DiagConsoleLogger(), DiagLogLevel.ERROR);

  const resource = new Resource({
    [SemanticResourceAttributes.SERVICE_NAME]: name,
  });

  const traceExporter = new OTLPTraceExporter({
    url: `${otlpEndpoint}/v1/traces`,
  });

  promExporter = new PrometheusExporter({
    port: 9464,
    startServer: true,
  });

  metricsRegistry = new Registry();

  sdk = new NodeSDK({
    resource,
    traceExporter,
    metricReader: promExporter,
    instrumentations: [
      new HttpInstrumentation(),
      new ExpressInstrumentation(),
    ],
  });

  sdk.start();
  initialized = true;
}

export function getMetricsRegistry(): Registry {
  if (!metricsRegistry) {
    metricsRegistry = new Registry();
  }
  return metricsRegistry;
}

export function getTracer(): Tracer {
  return trace.getTracer(process.env.OTEL_SERVICE_NAME || 'backend-service');
}

export function getPrometheusExporter(): PrometheusExporter | null {
  return promExporter;
}

type MetricType = 'histogram' | 'counter' | 'gauge';

export function createMetric(
  name: string,
  help: string,
  type: MetricType,
): Histogram | Counter | Gauge {
  const registry = getMetricsRegistry();

  switch (type) {
    case 'histogram': {
      const existing = registry.getSingleMetric(name) as Histogram | undefined;
      if (existing) return existing;
      const histogram = new Histogram({ name, help, registers: [registry] });
      return histogram;
    }
    case 'counter': {
      const existing = registry.getSingleMetric(name) as Counter | undefined;
      if (existing) return existing;
      const counter = new Counter({ name, help, registers: [registry] });
      return counter;
    }
    case 'gauge': {
      const existing = registry.getSingleMetric(name) as Gauge | undefined;
      if (existing) return existing;
      const gauge = new Gauge({ name, help, registers: [registry] });
      return gauge;
    }
  }
}

export function recordHttpRequest(
  method: string,
  path: string,
  statusCode: number,
  durationMs: number,
): void {
  const key = `${method}:${path}`;
  if (!httpDurationHistogram[key]) {
    httpDurationHistogram[key] = createMetric(
      `http_request_duration_${method.toLowerCase()}_${path.replace(/[^a-zA-Z0-9]/g, '_')}`,
      `HTTP request duration for ${method} ${path}`,
      'histogram',
    ) as Histogram;
  }
  httpDurationHistogram[key].observe(
    { method, path, status_code: statusCode },
    durationMs / 1000,
  );
}

export function recordServiceCall(
  service: string,
  method: string,
  durationMs: number,
  success: boolean,
): void {
  const key = `${service}:${method}`;
  if (!serviceCallHistogram[key]) {
    serviceCallHistogram[key] = createMetric(
      `service_call_duration_${service.replace(/[^a-zA-Z0-9]/g, '_')}`,
      `Service call duration for ${service}`,
      'histogram',
    ) as Histogram;
  }
  serviceCallHistogram[key].observe(
    { service, method, success: success ? 'true' : 'false' },
    durationMs / 1000,
  );
}
