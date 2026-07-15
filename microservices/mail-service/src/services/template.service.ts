import * as fs from 'fs';
import * as path from 'path';
import Handlebars from 'handlebars';
import { logger } from '../logging/logger';
import { TemplateId } from '../templates';

export interface RenderedTemplate {
  subject: string;
  html: string;
}

const TEMPLATE_SUBJECTS: Record<TemplateId, string> = {
  'account-recovery': 'Password Recovery Request',
  'policy-change': 'Policy Update Notice',
  'payment-receipt': 'Payment Receipt Confirmation',
};

const TEMPLATES_DIR = path.resolve(__dirname, '..', 'templates');

class TemplateService {
  private compiled = new Map<string, Handlebars.TemplateDelegate>();

  async init(): Promise<void> {
    const files = fs.readdirSync(TEMPLATES_DIR).filter((f) => f.endsWith('.hbs'));
    for (const file of files) {
      const name = file.replace(/\.hbs$/, '');
      const source = fs.readFileSync(path.join(TEMPLATES_DIR, file), 'utf-8');
      this.compiled.set(name, Handlebars.compile(source));
      logger.info({ message: 'Template compiled', template: name });
    }
    logger.info({ message: `Template service initialized with ${this.compiled.size} templates` });
  }

  render(templateId: TemplateId, variables: Record<string, unknown>): RenderedTemplate {
    const compileFn = this.compiled.get(templateId);
    if (!compileFn) {
      const known = Array.from(this.compiled.keys()).join(', ');
      throw new Error(`Unknown template "${templateId}". Available: ${known}`);
    }

    logger.info({ message: 'Rendering template', templateId, variables: Object.keys(variables) });
    const html = compileFn(variables);
    const subject = TEMPLATE_SUBJECTS[templateId] || 'Notification';

    return { subject, html };
  }

  getKnownTemplates(): string[] {
    return Array.from(this.compiled.keys());
  }
}

export const templateService = new TemplateService();
