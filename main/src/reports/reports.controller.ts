import { Controller, Get, Post, Body, Param } from '@nestjs/common';
import { ApiTags, ApiOperation, ApiResponse, ApiBearerAuth } from '@nestjs/swagger';
import { ReportsService, ReportInfo } from './reports.service';

interface GenerateReportDto {
  type: 'daily' | 'weekly' | 'incident' | 'manual';
  data?: Record<string, unknown>;
}

@ApiTags('Reports')
@ApiBearerAuth()
@Controller('reports')
export class ReportsController {
  constructor(private readonly reportsService: ReportsService) {}

  @Get()
  @ApiOperation({ summary: 'List all reports' })
  @ApiResponse({ status: 200, description: 'List of reports' })
  listReports(): Promise<ReportInfo[]> {
    return Promise.resolve(this.reportsService.getReports());
  }

  @Post('generate')
  @ApiOperation({ summary: 'Generate a new report (admin only)' })
  @ApiResponse({ status: 201, description: 'Report generated' })
  async generateReport(@Body() dto: GenerateReportDto): Promise<{ filename: string }> {
    const filename = await this.reportsService.generateReport(dto.type, dto.data);
    return { filename };
  }

  @Get(':filename')
  @ApiOperation({ summary: 'Get report content by filename' })
  @ApiResponse({ status: 200, description: 'Report content' })
  @ApiResponse({ status: 404, description: 'Report not found' })
  getReport(@Param('filename') filename: string): { content: string } {
    const content = this.reportsService.getReportContent(filename);
    return { content };
  }
}
