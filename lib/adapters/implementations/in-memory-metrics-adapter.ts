/**
 * In-Memory Metrics Adapter (Default Implementation)
 * Simple in-memory metrics for development
 */

import { IMetricsAdapter } from '../index'
import { logger } from '../../logger'

interface Metric {
  name: string
  type: 'counter' | 'gauge' | 'histogram' | 'timing'
  value: number
  labels?: Record<string, string>
  timestamp: Date
}

export class InMemoryMetricsAdapter implements IMetricsAdapter {
  private metrics: Metric[] = []
  private counters: Map<string, number> = new Map()
  private gauges: Map<string, number> = new Map()

  counter(name: string, value: number = 1, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels)
    const current = this.counters.get(key) || 0
    this.counters.set(key, current + value)

    this.record({
      name,
      type: 'counter',
      value: current + value,
      labels,
      timestamp: new Date(),
    })
  }

  gauge(name: string, value: number, labels?: Record<string, string>): void {
    const key = this.getKey(name, labels)
    this.gauges.set(key, value)

    this.record({
      name,
      type: 'gauge',
      value,
      labels,
      timestamp: new Date(),
    })
  }

  histogram(name: string, value: number, labels?: Record<string, string>): void {
    this.record({
      name,
      type: 'histogram',
      value,
      labels,
      timestamp: new Date(),
    })
  }

  timing(name: string, durationMs: number, labels?: Record<string, string>): void {
    this.record({
      name,
      type: 'timing',
      value: durationMs,
      labels,
      timestamp: new Date(),
    })
  }

  async flush(): Promise<void> {
    if (this.metrics.length > 0) {
      logger.debug('Metrics snapshot', {
        counters: Object.fromEntries(this.counters),
        gauges: Object.fromEntries(this.gauges),
        recentMetrics: this.metrics.slice(-10),
      })
    }
  }

  // Helper methods

  private record(metric: Metric): void {
    this.metrics.push(metric)

    // Keep only last 1000 metrics to prevent memory leak
    if (this.metrics.length > 1000) {
      this.metrics = this.metrics.slice(-1000)
    }
  }

  private getKey(name: string, labels?: Record<string, string>): string {
    if (!labels) return name

    const labelStr = Object.entries(labels)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${k}:${v}`)
      .join(',')

    return `${name}{${labelStr}}`
  }

  // Public getters for testing/debugging

  getCounterValue(name: string, labels?: Record<string, string>): number {
    const key = this.getKey(name, labels)
    return this.counters.get(key) || 0
  }

  getGaugeValue(name: string, labels?: Record<string, string>): number {
    const key = this.getKey(name, labels)
    return this.gauges.get(key) || 0
  }

  getAllMetrics(): Metric[] {
    return [...this.metrics]
  }

  clear(): void {
    this.metrics = []
    this.counters.clear()
    this.gauges.clear()
  }
}
