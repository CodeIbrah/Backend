import { Injectable, Inject, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { WINSTON_MODULE_NEST_PROVIDER } from 'nest-winston';
import { Logger } from 'winston';
import * as fs from 'fs';
import * as path from 'path';

export interface ReportInfo {
  filename: string;
  createdAt: Date;
  size: number;
  type: string;
}

export interface ReportData {
  name: string;
  date: string;
  cambios: string[];
  errores: string[];
  tareasHechas: string[];
  tareasPendientes: string[];
  tareasAHacer: string[];
  contexto: string;
  resumen: string;
}

@Injectable()
export class ReportsService {
  private readonly reportsDir: string;
  private readonly FILENAME_REGEX = /^[a-zA-Z0-9][a-zA-Z0-9._-]*\.(md|json|csv|txt)$/;

  constructor(
    @Inject(WINSTON_MODULE_NEST_PROVIDER) private readonly logger: Logger,
    private readonly configService: ConfigService,
  ) {
    this.reportsDir = path.join(process.cwd(), 'reports');
    if (!fs.existsSync(this.reportsDir)) {
      fs.mkdirSync(this.reportsDir, { recursive: true });
    }
  }

  private sanitizeFilename(filename: string): string {
    const sanitized = path.basename(filename);

    if (!this.FILENAME_REGEX.test(sanitized)) {
      throw new BadRequestException(
        `Invalid filename: '${filename}'. Only alphanumeric characters, dots, hyphens, and underscores are allowed. Must end with .md, .json, .csv, or .txt`,
      );
    }

    if (sanitized.includes('..') || sanitized.includes('/') || sanitized.includes('\\')) {
      throw new BadRequestException(`Invalid filename: path traversal detected`);
    }

    return sanitized;
  }

  private resolveSafePath(filename: string): string {
    const sanitized = this.sanitizeFilename(filename);
    const resolved = path.resolve(this.reportsDir, sanitized);

    if (!resolved.startsWith(this.reportsDir)) {
      throw new BadRequestException('Path traversal attempt blocked');
    }

    return resolved;
  }

  async generateReport(
    type: 'daily' | 'weekly' | 'incident' | 'manual',
    data?: any,
  ): Promise<string> {
    this.logger.info('Generating report', { type });

    const reportData: ReportData = {
      name: `${type.toUpperCase()} Report`,
      date: new Date().toISOString(),
      cambios: data?.cambios || ['No changes recorded'],
      errores: data?.errores || ['No errors recorded'],
      tareasHechas: data?.tareasHechas || [],
      tareasPendientes: data?.tareasPendientes || [],
      tareasAHacer: data?.tareasAHacer || [],
      contexto: data?.contexto || 'No additional context',
      resumen: data?.resumen || 'No summary available',
    };

    const content = this.formatReportMarkdown(reportData);
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const filename = `${type}-report-${timestamp}.md`;

    await this.saveReport(content, filename);

    this.logger.info('Report generated and saved', { type, filename });
    return filename;
  }

  async saveReport(content: string, filename: string): Promise<string> {
    const filePath = this.resolveSafePath(filename);
    fs.writeFileSync(filePath, content, 'utf-8');
    this.logger.info('Report saved', { filename, path: filePath });
    return filename;
  }

  async getReports(): Promise<ReportInfo[]> {
    if (!fs.existsSync(this.reportsDir)) {
      return [];
    }

    const files = fs.readdirSync(this.reportsDir);
    const reports: ReportInfo[] = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const filePath = path.join(this.reportsDir, file);
        const stats = fs.statSync(filePath);
        const type = file.split('-report-')[0] || 'unknown';

        reports.push({
          filename: file,
          createdAt: stats.birthtime,
          size: stats.size,
          type,
        });
      }
    }

    return reports.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
  }

  async getReportContent(filename: string): Promise<string> {
    const filePath = this.resolveSafePath(filename);
    if (!fs.existsSync(filePath)) {
      throw new BadRequestException(`Report '${filename}' not found`);
    }
    return fs.readFileSync(filePath, 'utf-8');
  }

  formatReportMarkdown(data: ReportData): string {
    const sections: string[] = [];

    sections.push(`# ${data.name}`);
    sections.push('');
    sections.push(`# ${data.date}`);
    sections.push('');
    sections.push('# Cambios');
    sections.push('');
    for (const cambio of data.cambios) {
      sections.push(`- ${cambio}`);
    }
    sections.push('');
    sections.push('# Errores');
    sections.push('');
    for (const error of data.errores) {
      sections.push(`- ${error}`);
    }
    sections.push('');
    sections.push('# Tareas pendientes y hechas');
    sections.push('');
    sections.push('## Hechas');
    sections.push('');
    for (const tarea of data.tareasHechas) {
      sections.push(`- ${tarea}`);
    }
    sections.push('');
    sections.push('## Pendientes');
    sections.push('');
    for (const tarea of data.tareasPendientes) {
      sections.push(`- ${tarea}`);
    }
    sections.push('');
    sections.push('# Tareas a hacer');
    sections.push('');
    for (const tarea of data.tareasAHacer) {
      sections.push(`- ${tarea}`);
    }
    sections.push('');
    sections.push('# Contexto');
    sections.push('');
    sections.push(data.contexto);
    sections.push('');
    sections.push('# Resumen');
    sections.push('');
    sections.push(data.resumen);
    sections.push('');

    return sections.join('\n');
  }
}
