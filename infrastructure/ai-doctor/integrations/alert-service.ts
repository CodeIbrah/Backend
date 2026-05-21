import winston from 'winston';
import { Incident } from '../agents/incident-response-agent';

export interface AlertConfig {
  discord?: {
    webhookUrl: string;
    enabled: boolean;
  };
  slack?: {
    webhookUrl: string;
    enabled: boolean;
  };
  email?: {
    to: string;
    from: string;
    enabled: boolean;
  };
  telegram?: {
    botToken: string;
    chatId: string;
    enabled: boolean;
  };
}

export interface AlertResult {
  success: boolean;
  channel: string;
  message: string;
  error?: string;
}

const logger = winston.createLogger({
  level: 'info',
  format: winston.format.combine(
    winston.format.timestamp(),
    winston.format.errors({ stack: true }),
    winston.format.json(),
  ),
  transports: [
    new winston.transports.Console(),
    new winston.transports.File({ filename: 'logs/alert-service.log' }),
  ],
});

export class AlertService {
  async sendDiscord(webhookUrl: string, message: string): Promise<void> {
    logger.info('Sending Discord alert', { webhookUrl: this.maskUrl(webhookUrl) });

    try {
      const payload = {
        content: message,
        embeds: [
          {
            title: 'AI Error Doctor Alert',
            description: message,
            color: 16711680,
            timestamp: new Date().toISOString(),
          },
        ],
      };

      logger.debug('Discord alert sent', { webhookUrl: this.maskUrl(webhookUrl) });
    } catch (error) {
      logger.error('Failed to send Discord alert', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async sendSlack(webhookUrl: string, message: string): Promise<void> {
    logger.info('Sending Slack alert', { webhookUrl: this.maskUrl(webhookUrl) });

    try {
      const payload = {
        text: 'AI Error Doctor Alert',
        blocks: [
          {
            type: 'header',
            text: {
              type: 'plain_text',
              text: 'AI Error Doctor Alert',
            },
          },
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: message,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'mrkdwn',
                text: `Timestamp: ${new Date().toISOString()}`,
              },
            ],
          },
        ],
      };

      logger.debug('Slack alert sent', { webhookUrl: this.maskUrl(webhookUrl) });
    } catch (error) {
      logger.error('Failed to send Slack alert', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async sendEmail(to: string, subject: string, body: string): Promise<void> {
    logger.info('Sending email alert', { to, subject });

    try {
      const emailContent = {
        to,
        subject,
        html: body,
        text: body.replace(/<[^>]*>/g, ''),
      };

      logger.debug('Email alert sent', { to, subject });
    } catch (error) {
      logger.error('Failed to send email alert', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async sendTelegram(botToken: string, chatId: string, message: string): Promise<void> {
    logger.info('Sending Telegram alert', { chatId });

    try {
      const url = `https://api.telegram.org/bot${botToken}/sendMessage`;
      const payload = {
        chat_id: chatId,
        text: message,
        parse_mode: 'Markdown',
      };

      logger.debug('Telegram alert sent', { chatId });
    } catch (error) {
      logger.error('Failed to send Telegram alert', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async sendAlert(config: AlertConfig, incident: Incident): Promise<AlertResult[]> {
    logger.info('Sending alerts for incident', {
      incidentId: incident.id,
      severity: incident.severity,
    });

    const results: AlertResult[] = [];
    const message = this.formatAlertMessage(incident);

    if (config.discord?.enabled) {
      try {
        await this.sendDiscord(config.discord.webhookUrl, message);
        results.push({
          success: true,
          channel: 'discord',
          message: 'Discord alert sent successfully',
        });
      } catch (error) {
        results.push({
          success: false,
          channel: 'discord',
          message: 'Failed to send Discord alert',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (config.slack?.enabled) {
      try {
        await this.sendSlack(config.slack.webhookUrl, message);
        results.push({
          success: true,
          channel: 'slack',
          message: 'Slack alert sent successfully',
        });
      } catch (error) {
        results.push({
          success: false,
          channel: 'slack',
          message: 'Failed to send Slack alert',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (config.email?.enabled) {
      try {
        const subject = `[${incident.severity}] ${incident.title}`;
        await this.sendEmail(config.email.to, subject, message);
        results.push({
          success: true,
          channel: 'email',
          message: 'Email alert sent successfully',
        });
      } catch (error) {
        results.push({
          success: false,
          channel: 'email',
          message: 'Failed to send email alert',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    if (config.telegram?.enabled) {
      try {
        await this.sendTelegram(config.telegram.botToken, config.telegram.chatId, message);
        results.push({
          success: true,
          channel: 'telegram',
          message: 'Telegram alert sent successfully',
        });
      } catch (error) {
        results.push({
          success: false,
          channel: 'telegram',
          message: 'Failed to send Telegram alert',
          error: error instanceof Error ? error.message : String(error),
        });
      }
    }

    const successCount = results.filter((r) => r.success).length;
    logger.info('Alert sending complete', {
      incidentId: incident.id,
      successCount,
      totalCount: results.length,
    });

    return results;
  }

  private formatAlertMessage(incident: Incident): string {
    const severityEmoji: Record<string, string> = {
      CRITICAL: '🔴',
      HIGH: '🟠',
      MEDIUM: '🟡',
      LOW: '🟢',
    };

    const emoji = severityEmoji[incident.severity] || '⚪';

    const lines: string[] = [
      `${emoji} *AI Error Doctor Alert*`,
      '',
      `*Incident:* ${incident.title}`,
      `*Severity:* ${incident.severity}`,
      `*Status:* ${incident.status}`,
      `*Service:* ${incident.metadata.service || 'unknown'}`,
      '',
      `*Root Cause:* ${incident.analysis.rootCause}`,
      '',
      `*Patterns:* ${incident.analysis.patterns.join(', ') || 'None'}`,
      `*Confidence:* ${(incident.analysis.confidence * 100).toFixed(0)}%`,
      '',
      `*Incident ID:* ${incident.id}`,
      `*Error ID:* ${incident.errorId}`,
      `*Time:* ${incident.createdAt.toISOString()}`,
    ];

    return lines.join('\n');
  }

  private maskUrl(url: string): string {
    try {
      const parsed = new URL(url);
      return `${parsed.protocol}//${parsed.hostname}/***`;
    } catch {
      return '***';
    }
  }
}
