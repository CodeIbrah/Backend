import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('auth-service');

export { tracer };
