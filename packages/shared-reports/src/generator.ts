import fs from 'fs';
import path from 'path';
import { ReportConfig, ReportData } from './types';

export class ReportGenerator {
  private config: ReportConfig;

  constructor(config: ReportConfig) {
    this.config = config;
  }

  async generate(data: ReportData): Promise<string> {
    return this.formatMarkdown(data);
  }

  async save(data: ReportData, customPath?: string): Promise<string> {
    const content = await this.generate(data);
    const outputPath = customPath || this.config.outputPath;
    const dir = path.dirname(outputPath);
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    fs.writeFileSync(outputPath, content, 'utf-8');
    return outputPath;
  }

  formatMarkdown(data: ReportData): string {
    const sections: string[] = [];

    if (this.config.sections.includes('NAME')) {
      sections.push(`# ${data.name}`);
    }

    if (this.config.sections.includes('DATE')) {
      sections.push(`# ${data.date}`);
    }

    if (this.config.sections.includes('CHANGES')) {
      sections.push('# Cambios');
      data.changes.forEach((change) => sections.push(`- ${change}`));
    }

    if (this.config.sections.includes('ERRORS')) {
      sections.push('# Errores');
      data.errors.forEach((error) => sections.push(`- ${error}`));
    }

    if (
      this.config.sections.includes('TASKS_DONE') ||
      this.config.sections.includes('TASKS_PENDING')
    ) {
      sections.push('# Tareas pendientes y hechas');

      if (this.config.sections.includes('TASKS_DONE')) {
        sections.push('## Hechas');
        data.tasksDone.forEach((task) => sections.push(`- ${task}`));
      }

      if (this.config.sections.includes('TASKS_PENDING')) {
        sections.push('## Pendientes');
        data.tasksPending.forEach((task) => sections.push(`- ${task}`));
      }
    }

    if (this.config.sections.includes('TASKS_TODO')) {
      sections.push('# Tareas a hacer');
      data.tasksTodo.forEach((task) => sections.push(`- ${task}`));
    }

    if (this.config.sections.includes('CONTEXT')) {
      sections.push('# Contexto');
      sections.push(data.context);
    }

    if (this.config.sections.includes('SUMMARY')) {
      sections.push('# Resumen');
      sections.push(data.summary);
    }

    return sections.join('\n\n') + '\n';
  }
}
