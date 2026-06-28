import { Controller, Get, Res, Req } from '@nestjs/common';
import { Response, Request } from 'express';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import * as promClient from 'prom-client';

const register = new promClient.Registry();

promClient.collectDefaultMetrics({ register });

const ALLOWED_METRICS_IPS = (process.env.ALLOWED_METRICS_IPS || '127.0.0.1,::1').split(',');
const METRICS_API_KEY = process.env.METRICS_API_KEY || '';

function metricsGuard(req: Request): boolean {
  const clientIp = req.ip || req.socket.remoteAddress || '';
  const apiKey = req.headers['x-metrics-api-key'] as string;

  if (METRICS_API_KEY && apiKey === METRICS_API_KEY) {
    return true;
  }

  const isAllowedIp = ALLOWED_METRICS_IPS.some((allowed) => clientIp === allowed);

  return isAllowedIp;
}

@ApiTags('Metrics')
@ApiBearerAuth('JWT-auth')
@Controller('metrics')
export class MetricsController {
  @Get()
  @ApiOperation({ summary: 'Prometheus metrics endpoint (protected)' })
  async metrics(@Res() res: Response, @Req() req: Request): Promise<void> {
    if (!metricsGuard(req)) {
      res.status(403).json({
        error: 'Forbidden',
        message: 'Access to metrics requires a valid API key or allowed IP address',
      });
      return;
    }

    res.set('Content-Type', register.contentType);
    res.set('X-Robots-Tag', 'noindex, nofollow');
    res.end(await register.metrics());
  }
}
