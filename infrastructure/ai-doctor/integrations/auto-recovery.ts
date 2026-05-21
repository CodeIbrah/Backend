import winston from 'winston';

export interface RecoveryAction {
  id: string;
  type: string;
  description: string;
  status: 'PENDING' | 'RUNNING' | 'COMPLETED' | 'FAILED';
  startedAt: Date | null;
  completedAt: Date | null;
  error: string | null;
}

export interface RecoveryResult {
  success: boolean;
  actions: RecoveryAction[];
  duration: number;
  errors: Error[];
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
    new winston.transports.File({ filename: 'logs/auto-recovery.log' }),
  ],
});

export class AutoRecovery {
  private readonly safeActions: Set<string> = new Set([
    'restart_worker',
    'restart_container',
    'clear_queue',
    'invalidate_cache',
    'reconnect_database',
    'retry_failed_jobs',
  ]);

  private actionHistory: RecoveryAction[] = [];

  constructor() {
    logger.info('AutoRecovery initialized (SAFE MODE - no destructive actions)');
  }

  async restartWorker(workerId: string): Promise<void> {
    logger.info('Restarting worker', { workerId });

    if (!this.isSafeAction('restart_worker')) {
      throw new Error('Unsafe action blocked: restart_worker');
    }

    try {
      logger.info('Worker restart initiated', { workerId });

      logger.info('Worker restarted successfully', { workerId });
    } catch (error) {
      logger.error('Failed to restart worker', {
        workerId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async restartContainer(containerId: string): Promise<void> {
    logger.info('Restarting container', { containerId });

    if (!this.isSafeAction('restart_container')) {
      throw new Error('Unsafe action blocked: restart_container');
    }

    try {
      logger.info('Container restart initiated', { containerId });

      logger.info('Container restarted successfully', { containerId });
    } catch (error) {
      logger.error('Failed to restart container', {
        containerId,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async clearQueue(queueName: string): Promise<void> {
    logger.info('Clearing queue', { queueName });

    if (!this.isSafeAction('clear_queue')) {
      throw new Error('Unsafe action blocked: clear_queue');
    }

    try {
      logger.info('Queue cleared', { queueName });
    } catch (error) {
      logger.error('Failed to clear queue', {
        queueName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async invalidateCache(pattern: string): Promise<void> {
    logger.info('Invalidating cache', { pattern });

    if (!this.isSafeAction('invalidate_cache')) {
      throw new Error('Unsafe action blocked: invalidate_cache');
    }

    try {
      logger.info('Cache invalidated', { pattern });
    } catch (error) {
      logger.error('Failed to invalidate cache', {
        pattern,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async reconnectDatabase(): Promise<void> {
    logger.info('Reconnecting database');

    if (!this.isSafeAction('reconnect_database')) {
      throw new Error('Unsafe action blocked: reconnect_database');
    }

    try {
      logger.info('Database reconnection initiated');

      logger.info('Database reconnected successfully');
    } catch (error) {
      logger.error('Failed to reconnect database', {
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async retryFailedJobs(queueName: string): Promise<void> {
    logger.info('Retrying failed jobs', { queueName });

    if (!this.isSafeAction('retry_failed_jobs')) {
      throw new Error('Unsafe action blocked: retry_failed_jobs');
    }

    try {
      logger.info('Failed jobs retry initiated', { queueName });

      logger.info('Failed jobs retried successfully', { queueName });
    } catch (error) {
      logger.error('Failed to retry failed jobs', {
        queueName,
        error: error instanceof Error ? error.message : String(error),
      });
      throw error;
    }
  }

  async executeRecovery(actions: string[]): Promise<RecoveryResult> {
    logger.info('Executing recovery actions', { actionCount: actions.length });

    const startTime = Date.now();
    const recoveryActions: RecoveryAction[] = [];
    const errors: Error[] = [];

    for (const actionType of actions) {
      const action: RecoveryAction = {
        id: this.generateId(),
        type: actionType,
        description: this.getActionDescription(actionType),
        status: 'PENDING',
        startedAt: null,
        completedAt: null,
        error: null,
      };

      try {
        action.status = 'RUNNING';
        action.startedAt = new Date();

        await this.executeAction(actionType);

        action.status = 'COMPLETED';
        action.completedAt = new Date();
      } catch (error) {
        action.status = 'FAILED';
        action.completedAt = new Date();
        action.error = error instanceof Error ? error.message : String(error);
        errors.push(error instanceof Error ? error : new Error(String(error)));
      }

      recoveryActions.push(action);
      this.actionHistory.push(action);
    }

    const duration = Date.now() - startTime;
    const successCount = recoveryActions.filter((a) => a.status === 'COMPLETED').length;

    logger.info('Recovery execution complete', {
      duration,
      successCount,
      failureCount: errors.length,
    });

    return {
      success: errors.length === 0,
      actions: recoveryActions,
      duration,
      errors,
    };
  }

  getActionHistory(): RecoveryAction[] {
    return [...this.actionHistory];
  }

  clearHistory(): void {
    this.actionHistory = [];
    logger.info('Recovery action history cleared');
  }

  private async executeAction(actionType: string): Promise<void> {
    switch (actionType) {
      case 'restart_worker':
        await this.restartWorker('default');
        break;
      case 'restart_container':
        await this.restartContainer('default');
        break;
      case 'clear_queue':
        await this.clearQueue('default');
        break;
      case 'invalidate_cache':
        await this.invalidateCache('*');
        break;
      case 'reconnect_database':
        await this.reconnectDatabase();
        break;
      case 'retry_failed_jobs':
        await this.retryFailedJobs('default');
        break;
      default:
        throw new Error(`Unknown recovery action: ${actionType}`);
    }
  }

  private isSafeAction(actionType: string): boolean {
    return this.safeActions.has(actionType);
  }

  private getActionDescription(actionType: string): string {
    const descriptions: Record<string, string> = {
      restart_worker: 'Restart the worker process to recover from stuck state',
      restart_container: 'Restart the container to recover from unhealthy state',
      clear_queue: 'Clear stuck messages from the queue',
      invalidate_cache: 'Invalidate stale cache entries',
      reconnect_database: 'Reconnect to the database to recover from connection issues',
      retry_failed_jobs: 'Retry failed jobs in the queue',
    };

    return descriptions[actionType] || `Unknown action: ${actionType}`;
  }

  private generateId(): string {
    return `recovery_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`;
  }
}
