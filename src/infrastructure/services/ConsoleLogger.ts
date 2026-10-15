import type { ILogger } from '@/src/application/ports/input/ILogger'

export class ConsoleLogger implements ILogger {
  private prefix: string

  constructor(prefix = 'EBPS') {
    this.prefix = prefix
  }

  private fmt(level: string, message: string, meta?: Record<string, unknown>): string {
    const base = `[${this.prefix}] ${level} ${message}`
    return meta ? `${base} ${JSON.stringify(meta)}` : base
  }

  debug(message: string, meta?: Record<string, unknown>): void {
    console.debug(this.fmt('DEBUG', message, meta))
  }

  info(message: string, meta?: Record<string, unknown>): void {
    console.info(this.fmt('INFO', message, meta))
  }

  warn(message: string, meta?: Record<string, unknown>): void {
    console.warn(this.fmt('WARN', message, meta))
  }

  error(message: string, meta?: Record<string, unknown>): void {
    console.error(this.fmt('ERROR', message, meta))
  }
}
