/**
 * Structured Logger
 * Consistent logging with context and levels
 */

export type LogLevel = 'debug' | 'info' | 'warn' | 'error'

export interface LogContext {
  [key: string]: any
}

export interface LogEntry {
  level: LogLevel
  message: string
  context?: LogContext
  timestamp: Date
  requestId?: string
}

class Logger {
  private requestId?: string
  private minLevel: LogLevel = 'info'

  constructor() {
    // Set log level from environment
    const envLevel = process.env.LOG_LEVEL?.toLowerCase()
    if (envLevel && this.isValidLevel(envLevel)) {
      this.minLevel = envLevel as LogLevel
    }
  }

  /**
   * Set request ID for correlation
   */
  setRequestId(requestId: string): void {
    this.requestId = requestId
  }

  /**
   * Clear request ID
   */
  clearRequestId(): void {
    this.requestId = undefined
  }

  /**
   * Log debug message
   */
  debug(message: string, context?: LogContext): void {
    this.log('debug', message, context)
  }

  /**
   * Log info message
   */
  info(message: string, context?: LogContext): void {
    this.log('info', message, context)
  }

  /**
   * Log warning message
   */
  warn(message: string, context?: LogContext): void {
    this.log('warn', message, context)
  }

  /**
   * Log error message
   */
  error(message: string, context?: LogContext): void {
    this.log('error', message, context)
  }

  /**
   * Log with explicit level
   */
  log(level: LogLevel, message: string, context?: LogContext): void {
    if (!this.shouldLog(level)) {
      return
    }

    const entry: LogEntry = {
      level,
      message,
      context,
      timestamp: new Date(),
      requestId: this.requestId,
    }

    this.write(entry)
  }

  /**
   * Create a child logger with additional context
   */
  child(context: LogContext): Logger {
    const childLogger = new Logger()
    childLogger.requestId = this.requestId
    childLogger.minLevel = this.minLevel

    // Override log method to include parent context
    const originalLog = childLogger.log.bind(childLogger)
    childLogger.log = (level: LogLevel, message: string, childContext?: LogContext) => {
      originalLog(level, message, { ...context, ...childContext })
    }

    return childLogger
  }

  /**
   * Measure execution time
   */
  async measure<T>(
    label: string,
    fn: () => Promise<T>,
    context?: LogContext
  ): Promise<T> {
    const start = Date.now()

    try {
      const result = await fn()
      const duration = Date.now() - start

      this.info(`${label} completed`, { ...context, durationMs: duration })

      return result
    } catch (error) {
      const duration = Date.now() - start

      this.error(`${label} failed`, {
        ...context,
        durationMs: duration,
        error: error instanceof Error ? error.message : String(error),
      })

      throw error
    }
  }

  // Private methods

  private write(entry: LogEntry): void {
    const { level, message, context, timestamp, requestId } = entry

    // Format for console output
    const contextStr = context ? ` ${JSON.stringify(context)}` : ''
    const requestIdStr = requestId ? ` [${requestId}]` : ''
    const timeStr = timestamp.toISOString()

    const logMessage = `[${timeStr}] ${level.toUpperCase()}${requestIdStr}: ${message}${contextStr}`

    // Output to appropriate stream
    switch (level) {
      case 'error':
        console.error(logMessage)
        break
      case 'warn':
        console.warn(logMessage)
        break
      case 'debug':
      case 'info':
      default:
        console.log(logMessage)
    }
  }

  private shouldLog(level: LogLevel): boolean {
    const levels: LogLevel[] = ['debug', 'info', 'warn', 'error']
    const minIndex = levels.indexOf(this.minLevel)
    const currentIndex = levels.indexOf(level)
    return currentIndex >= minIndex
  }

  private isValidLevel(level: string): boolean {
    return ['debug', 'info', 'warn', 'error'].includes(level)
  }
}

// Singleton logger instance
export const logger = new Logger()

/**
 * Create a child logger with context
 */
export function createLogger(context: LogContext): Logger {
  return logger.child(context)
}
