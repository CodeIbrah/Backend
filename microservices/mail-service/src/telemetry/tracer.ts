import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('mail-service');

export { tracer };
