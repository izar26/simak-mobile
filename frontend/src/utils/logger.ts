// ==========================================
// LOGGER UTILITY
// ==========================================

enum LogLevel {
  DEBUG = 'DEBUG',
  INFO = 'INFO',
  WARN = 'WARN',
  ERROR = 'ERROR',
}

interface LogEntry {
  level: LogLevel;
  timestamp: string;
  context: string;
  message: string;
  data?: any;
}

class Logger {
  private isDev = __DEV__;
  private logs: LogEntry[] = [];
  private maxLogs = 100;

  private createEntry(
    level: LogLevel,
    context: string,
    message: string,
    data?: any,
  ): LogEntry {
    return {
      level,
      timestamp: new Date().toISOString(),
      context,
      message,
      data,
    };
  }

  private log(entry: LogEntry): void {
    // Store log in memory
    this.logs.push(entry);
    if (this.logs.length > this.maxLogs) {
      this.logs.shift();
    }

    // Only print in development
    if (!this.isDev) return;

    const prefix = `[${entry.level}] [${entry.context}] ${entry.message}`;

    switch (entry.level) {
      case LogLevel.DEBUG:
        console.debug(prefix, entry.data || '');
        break;
      case LogLevel.INFO:
        console.log(prefix, entry.data || '');
        break;
      case LogLevel.WARN:
        console.warn(prefix, entry.data || '');
        break;
      case LogLevel.ERROR:
        console.error(prefix, entry.data || '');
        break;
    }
  }

  debug(context: string, message: string, data?: any): void {
    this.log(this.createEntry(LogLevel.DEBUG, context, message, data));
  }

  info(context: string, message: string, data?: any): void {
    this.log(this.createEntry(LogLevel.INFO, context, message, data));
  }

  warn(context: string, message: string, data?: any): void {
    this.log(this.createEntry(LogLevel.WARN, context, message, data));
  }

  error(context: string, message: string, data?: any): void {
    this.log(this.createEntry(LogLevel.ERROR, context, message, data));
  }

  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  clearLogs(): void {
    this.logs = [];
  }

  exportLogs(): string {
    return this.logs
      .map(
        log => `${log.timestamp} [${log.level}] ${log.context}: ${log.message}`,
      )
      .join('\n');
  }
}

export const logger = new Logger();
