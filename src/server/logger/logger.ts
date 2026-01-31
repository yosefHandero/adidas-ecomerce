/**
 * Structured logging utility
 * - Development: Human-readable console logs
 * - Production: Structured JSON logs
 */

type LogLevel = 'error' | 'warn' | 'info' | 'debug';

interface LogContext {
  [key: string]: unknown;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';

  private formatMessage(level: LogLevel, message: string, context?: LogContext): string {
    const timestamp = new Date().toISOString();
    const prefix = `[${timestamp}] [${level.toUpperCase()}]`;

    if (this.isDevelopment) {
      // Human-readable format for development
      if (context && Object.keys(context).length > 0) {
        return `${prefix} ${message}\n${JSON.stringify(context, null, 2)}`;
      }
      return `${prefix} ${message}`;
    }

    // Structured JSON for production
    const logEntry = {
      timestamp,
      level,
      message,
      ...context,
    };
    return JSON.stringify(logEntry);
  }

  error(message: string, context?: LogContext): void {
    console.error(this.formatMessage('error', message, context));
  }

  warn(message: string, context?: LogContext): void {
    console.warn(this.formatMessage('warn', message, context));
  }

  info(message: string, context?: LogContext): void {
    console.log(this.formatMessage('info', message, context));
  }

  debug(message: string, context?: LogContext): void {
    if (this.isDevelopment) {
      console.log(this.formatMessage('debug', message, context));
    }
  }
}

// Singleton instance
export const logger = new Logger();
