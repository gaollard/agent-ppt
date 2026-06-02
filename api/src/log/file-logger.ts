import { LoggerService } from '@nestjs/common';
import { appendFileSync, mkdirSync } from 'fs';
import { join } from 'path';
import { resolveLogDir } from './resolve-log-dir';

type LogLevel = 'LOG' | 'ERROR' | 'WARN' | 'DEBUG' | 'VERBOSE';

export class FileLogger implements LoggerService {
  private readonly logDir: string;

  constructor(logDir?: string) {
    this.logDir = logDir ?? resolveLogDir();
    mkdirSync(this.logDir, { recursive: true });
  }

  log(message: unknown, context?: string): void {
    this.write('LOG', message, context);
  }

  error(message: unknown, trace?: string, context?: string): void {
    this.write('ERROR', message, context);
    if (trace) {
      this.write('ERROR', trace, context);
    }
  }

  warn(message: unknown, context?: string): void {
    this.write('WARN', message, context);
  }

  debug(message: unknown, context?: string): void {
    this.write('DEBUG', message, context);
  }

  verbose(message: unknown, context?: string): void {
    this.write('VERBOSE', message, context);
  }

  private write(level: LogLevel, message: unknown, context?: string): void {
    const line = this.formatLine(level, message, context);
    appendFileSync(this.logFilePath(), `${line}\n`, 'utf8');
    this.printToConsole(level, line);
  }

  private logFilePath(): string {
    const date = new Date().toISOString().slice(0, 10);
    return join(this.logDir, `${date}.log`);
  }

  private formatLine(
    level: LogLevel,
    message: unknown,
    context?: string,
  ): string {
    const timestamp = new Date().toISOString();
    const ctx = context ? `[${context}] ` : '';
    return `${timestamp} [${level}] ${ctx}${this.formatMessage(message)}`;
  }

  private formatMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }
    if (message instanceof Error) {
      return message.stack ?? message.message;
    }
    try {
      return JSON.stringify(message);
    } catch {
      return String(message);
    }
  }

  private printToConsole(level: LogLevel, line: string): void {
    switch (level) {
      case 'ERROR':
        console.error(line);
        break;
      case 'WARN':
        console.warn(line);
        break;
      case 'DEBUG':
      case 'VERBOSE':
        console.debug(line);
        break;
      default:
        console.log(line);
    }
  }
}

export function createFileLogger(logDir?: string): FileLogger {
  return new FileLogger(logDir);
}
