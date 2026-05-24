import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('invoice-service');

export { tracer };
