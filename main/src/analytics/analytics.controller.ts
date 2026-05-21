import { Controller, Get, UseGuards } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth } from '@nestjs/swagger';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { AnalyticsService } from './analytics.service';

@ApiTags('Analytics')
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard)
@Controller('analytics')
export class AnalyticsController {
  constructor(private readonly analyticsService: AnalyticsService) {}

  @Get('overview')
  @ApiOperation({ summary: 'Get analytics overview' })
  async getOverview() {
    return this.analyticsService.getOverview();
  }

  @Get('usage')
  @ApiOperation({ summary: 'Get usage analytics' })
  async getUsage() {
    return this.analyticsService.getUsage();
  }

  @Get('errors')
  @ApiOperation({ summary: 'Get error analytics' })
  async getErrors() {
    return this.analyticsService.getErrors();
  }

  @Get('performance')
  @ApiOperation({ summary: 'Get performance analytics' })
  async getPerformance() {
    return this.analyticsService.getPerformance();
  }
}
