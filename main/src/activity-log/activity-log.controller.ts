import { Controller, Get, Post, Param, Query, Body, UseGuards, Res } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiBearerAuth, ApiQuery } from '@nestjs/swagger';
import { Response } from 'express';
import { ActivityLog } from '@prisma/client';
import { ActivityLogService } from './activity-log.service';
import { QueryActivityDto } from './dto/query-activity.dto';
import { JwtAuthGuard } from '../common/guards/jwt-auth.guard';
import { RolesGuard } from '../common/guards/roles.guard';
import { Roles } from '../common/decorators/roles.decorator';

interface CsvActivity {
  id: string;
  userId: string | null;
  user?: { email: string } | null;
  type: string;
  severity: string;
  action: string;
  resource: string | null;
  description: string | null;
  ipAddress: string | null;
  createdAt: Date;
}

@ApiTags('Activity Log')
@ApiBearerAuth()
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ADMIN')
@Controller('activity-log')
export class ActivityLogController {
  constructor(private readonly activityLogService: ActivityLogService) {}

  @Get()
  @ApiOperation({ summary: 'Get all activity logs (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  @ApiQuery({
    name: 'type',
    required: false,
    enum: [
      'LOGIN',
      'LOGOUT',
      'LOGIN_FAILED',
      'PAYMENT_CREATED',
      'PAYMENT_COMPLETED',
      'PAYMENT_FAILED',
      'PAYMENT_REFUNDED',
      'INVOICE_GENERATED',
      'INVOICE_DOWNLOADED',
      'USER_CREATED',
      'USER_UPDATED',
      'USER_DELETED',
      'ROLE_CHANGED',
      'PASSWORD_CHANGED',
      'SETTINGS_UPDATED',
      'DATA_EXPORTED',
      'PERMISSION_GRANTED',
      'PERMISSION_REVOKED',
      'API_KEY_CREATED',
      'API_KEY_REVOKED',
      'CONFIG_CHANGED',
      'SYSTEM_ALERT',
    ],
  })
  @ApiQuery({ name: 'severity', required: false, enum: ['INFO', 'WARNING', 'ERROR', 'CRITICAL'] })
  @ApiQuery({ name: 'userId', required: false, type: String })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  @ApiQuery({ name: 'search', required: false, type: String })
  async findAll(
    @Query() query: QueryActivityDto,
  ): Promise<{ activities: ActivityLog[]; total: number }> {
    const { page = 1, limit = 20, ...filters } = query;
    return this.activityLogService.getSystemActivities(page, limit, filters);
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get activity log by ID (admin only)' })
  async findOne(@Param('id') id: string): Promise<ActivityLog> {
    return this.activityLogService.getActivityById(id);
  }

  @Get('user/:userId')
  @ApiOperation({ summary: 'Get activities for a specific user (admin only)' })
  @ApiQuery({ name: 'page', required: false, type: Number })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async findUserActivities(
    @Param('userId') userId: string,
    @Query() query: QueryActivityDto,
  ): Promise<{ activities: ActivityLog[]; total: number }> {
    const { page = 1, limit = 20, ...filters } = query;
    return this.activityLogService.getUserActivities(userId, page, limit, filters);
  }

  @Get('stats')
  @ApiOperation({ summary: 'Get activity statistics (admin only)' })
  @ApiQuery({ name: 'dateFrom', required: false, type: String })
  @ApiQuery({ name: 'dateTo', required: false, type: String })
  async getStats(
    @Query('dateFrom') dateFrom?: string,
    @Query('dateTo') dateTo?: string,
  ): Promise<{
    byType: Record<string, number>;
    bySeverity: Record<string, number>;
    byUser: Record<string, number>;
    total: number;
  }> {
    return this.activityLogService.getActivityStats(dateFrom, dateTo);
  }

  @Get('critical')
  @ApiOperation({ summary: 'Get recent critical/error activities (admin only)' })
  @ApiQuery({ name: 'limit', required: false, type: Number })
  async getCritical(@Query('limit') limit?: number): Promise<ActivityLog[]> {
    return this.activityLogService.getRecentCriticalActivities(limit || 20);
  }

  @Post('export')
  @ApiOperation({ summary: 'Export activities to CSV/JSON (admin only)' })
  async exportActivities(
    @Body() body: QueryActivityDto & { format?: 'csv' | 'json' },
    @Res() res: Response,
  ): Promise<void> {
    const { format = 'json', ...filters } = body;
    const activities = await this.activityLogService.exportActivities(filters);

    if (format === 'csv') {
      const csv = this.convertToCsv(activities);
      res.setHeader('Content-Type', 'text/csv');
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=activity-log-${new Date().toISOString().split('T')[0]}.csv`,
      );
      res.send(csv);
    }

    res.setHeader('Content-Type', 'application/json');
    res.setHeader(
      'Content-Disposition',
      `attachment; filename=activity-log-${new Date().toISOString().split('T')[0]}.json`,
    );
    res.json(activities);
  }

  private convertToCsv(activities: CsvActivity[]): string {
    const headers = [
      'id',
      'userId',
      'userEmail',
      'type',
      'severity',
      'action',
      'resource',
      'description',
      'ipAddress',
      'createdAt',
    ];

    const rows = activities.map((a) => [
      a.id,
      a.userId || '',
      a.user?.email || '',
      a.type,
      a.severity,
      a.action,
      a.resource || '',
      a.description || '',
      a.ipAddress || '',
      a.createdAt.toISOString(),
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(',')),
    ].join('\n');

    return csvContent;
  }
}
