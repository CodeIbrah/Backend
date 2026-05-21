import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('users-service');

export { tracer };
