let sdkInstance: { shutdown: () => Promise<void> } | null = null;

export function initOpenTelemetry(): void {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const { NodeSDK } = require('@opentelemetry/sdk-node');
    const { getNodeAutoInstrumentations } = require('@opentelemetry/auto-instrumentations-node');
    const { OTLPTraceExporter } = require('@opentelemetry/exporter-trace-otlp-http');
    const { Resource } = require('@opentelemetry/resources');
    const { SemanticResourceAttributes } = require('@opentelemetry/semantic-conventions');

    const sdk = new NodeSDK({
      resource: new Resource({
        [SemanticResourceAttributes.SERVICE_NAME]: process.env.OTEL_SERVICE_NAME || 'backend-template',
      }),
      traceExporter: new OTLPTraceExporter({
        url: process.env.OTEL_EXPORTER_OTLP_ENDPOINT || 'http://jaeger:4318/v1/traces',
      }),
      instrumentations: [getNodeAutoInstrumentations()],
    });

    sdk.start();
    sdkInstance = sdk;
  } catch {
    console.warn('OpenTelemetry not available, skipping initialization');
  }
}

export async function shutdownOpenTelemetry(): Promise<void> {
  if (sdkInstance) {
    try {
      await sdkInstance.shutdown();
      console.log('[OpenTelemetry] SDK shut down successfully');
    } catch {
      console.warn('[OpenTelemetry] Error during SDK shutdown');
    }
  }
}
