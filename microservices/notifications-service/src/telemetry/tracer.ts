import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('notifications-service');

export { tracer };
