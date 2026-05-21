import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('payment-service');

export { tracer };
