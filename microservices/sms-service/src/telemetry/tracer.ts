import { trace } from '@opentelemetry/api';

const tracer = trace.getTracer('sms-service');

export { tracer };
