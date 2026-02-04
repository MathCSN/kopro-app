import { supabase } from '@/integrations/supabase/client';
import { AppError, ErrorSeverity } from './errorTypes';

interface ErrorLogEntry {
  error_type: string;
  error_message: string;
  error_stack?: string;
  severity: ErrorSeverity;
  user_message: string;
  status_code?: number;
  details?: Record<string, unknown>;
  user_id?: string;
  url: string;
  user_agent: string;
  timestamp: string;
}

class ErrorLogger {
  private queue: ErrorLogEntry[] = [];
  private isProcessing = false;
  private readonly MAX_QUEUE_SIZE = 50;
  private readonly FLUSH_INTERVAL = 10000;

  constructor() {
    if (typeof window !== 'undefined') {
      setInterval(() => this.flush(), this.FLUSH_INTERVAL);

      window.addEventListener('beforeunload', () => {
        this.flush();
      });
    }
  }

  async log(error: AppError, userId?: string): Promise<void> {
    const entry: ErrorLogEntry = {
      error_type: error.type,
      error_message: error.message,
      error_stack: error.stack,
      severity: error.severity,
      user_message: error.userMessage,
      status_code: error.statusCode,
      details: {
        ...error.details,
        name: error.name,
        isRecoverable: error.isRecoverable,
      },
      user_id: userId,
      url: window.location.href,
      user_agent: navigator.userAgent,
      timestamp: error.timestamp,
    };

    this.queue.push(entry);

    if (this.queue.length >= this.MAX_QUEUE_SIZE) {
      await this.flush();
    }

    if (error.severity === ErrorSeverity.CRITICAL) {
      await this.flush();
    }
  }

  private async flush(): Promise<void> {
    if (this.isProcessing || this.queue.length === 0) {
      return;
    }

    this.isProcessing = true;
    const entries = [...this.queue];
    this.queue = [];

    try {
      // Log to console instead of database since error_logs table doesn't exist
      entries.forEach(entry => {
        console.error('[ErrorLogger]', {
          type: entry.error_type,
          message: entry.error_message,
          severity: entry.severity,
          url: entry.url,
          timestamp: entry.timestamp,
        });
      });
    } catch (err) {
      console.error('Error logging failed:', err);
      this.queue.push(...entries);
    } finally {
      this.isProcessing = false;
    }
  }

  async clearOldLogs(daysToKeep: number = 30): Promise<void> {
    // No-op since error_logs table doesn't exist
    // Logs are stored in console only
    console.log(`[ErrorLogger] clearOldLogs called with daysToKeep: ${daysToKeep}`);
  }
}

export const errorLogger = new ErrorLogger();

export function logError(error: AppError, userId?: string): void {
  console.error('Application Error:', {
    type: error.type,
    message: error.message,
    severity: error.severity,
    details: error.details,
    stack: error.stack,
  });

  errorLogger.log(error, userId).catch((err) => {
    console.error('Failed to log error:', err);
  });
}

export function logConsoleError(
  message: string,
  error?: Error | unknown
): void {
  if (process.env.NODE_ENV === 'development') {
    console.error(message, error);
  }
}
