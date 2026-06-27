import type { NodeSDK } from '@opentelemetry/sdk-node';

let sdkInstance: { shutdown: () => Promise<void> } | null = null;

export async function initOpenTelemetry(): Promise<void> {
  if (process.env.NODE_ENV === 'test') {
    return;
  }

  try {
    const { NodeSDK: NodeSDKClass } = await import('@opentelemetry/sdk-node') as { NodeSDK: typeof NodeSDK };
    const { getNodeAutoInstrumentations } = await import('@opentelemetry/auto-instrumentations-node') as { getNodeAutoInstrumentations: () => unknown };
    const { OTLPTraceExporter } = await import('@opentelemetry/exporter-trace-otlp-http') as { OTLPTraceExporter: new (config: { url?: string }) => unknown };
    const { Resource } = await import('@opentelemetry/resources') as { Resource: new (attributes: Record<string, string>) => unknown };
    const { SemanticResourceAttributes } = await import('@opentelemetry/semantic-conventions') as { SemanticResourceAttributes: Record<string, string> };

    const sdk = new NodeSDKClass({
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
