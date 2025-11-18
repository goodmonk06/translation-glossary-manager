/**
 * Metrics Utility
 * Global metrics recording with pluggable adapter
 */

import { IMetricsAdapter } from './adapters'
import { InMemoryMetricsAdapter } from './adapters/implementations/in-memory-metrics-adapter'

class MetricsManager {
  private adapter: IMetricsAdapter

  constructor() {
    // Default to in-memory adapter
    this.adapter = new InMemoryMetricsAdapter()
  }

  /**
   * Set a custom metrics adapter
   */
  setAdapter(adapter: IMetricsAdapter): void {
    this.adapter = adapter
  }

  /**
   * Get current adapter
   */
  getAdapter(): IMetricsAdapter {
    return this.adapter
  }

  /**
   * Record a counter metric
   */
  counter(name: string, value?: number, labels?: Record<string, string>): void {
    this.adapter.counter(name, value, labels)
  }

  /**
   * Record a gauge metric
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void {
    this.adapter.gauge(name, value, labels)
  }

  /**
   * Record a histogram metric
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void {
    this.adapter.histogram(name, value, labels)
  }

  /**
   * Record a timing metric
   */
  timing(name: string, durationMs: number, labels?: Record<string, string>): void {
    this.adapter.timing(name, durationMs, labels)
  }

  /**
   * Measure execution time and record
   */
  async measure<T>(
    name: string,
    fn: () => Promise<T>,
    labels?: Record<string, string>
  ): Promise<T> {
    const start = Date.now()

    try {
      const result = await fn()
      const duration = Date.now() - start

      this.timing(name, duration, labels)

      return result
    } catch (error) {
      const duration = Date.now() - start

      this.timing(name, duration, { ...labels, error: 'true' })

      throw error
    }
  }

  /**
   * Flush metrics (if batched)
   */
  async flush(): Promise<void> {
    await this.adapter.flush()
  }
}

// Singleton instance
export const metrics = new MetricsManager()

// Metric name constants for consistency
export const MetricNames = {
  // API metrics
  API_REQUEST: 'api.request',
  API_RESPONSE_TIME: 'api.response_time',
  API_ERROR: 'api.error',

  // Database metrics
  DB_QUERY: 'db.query',
  DB_QUERY_TIME: 'db.query_time',
  DB_CONNECTION: 'db.connection',

  // Translation metrics
  TRANSLATION_FETCH: 'translation.fetch',
  TRANSLATION_CREATE: 'translation.create',
  TRANSLATION_UPDATE: 'translation.update',
  TRANSLATION_DELETE: 'translation.delete',

  // Export metrics
  EXPORT_GENERATED: 'export.generated',
  EXPORT_SIZE: 'export.size',

  // Cache metrics
  CACHE_HIT: 'cache.hit',
  CACHE_MISS: 'cache.miss',
  CACHE_SET: 'cache.set',

  // Event metrics
  EVENT_PUBLISHED: 'event.published',
  EVENT_PROCESSED: 'event.processed',
} as const
