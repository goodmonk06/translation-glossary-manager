/**
 * Adapter Interfaces
 * Define interfaces for pluggable external services
 */

import { AllDomainEvents } from '../events'

// Notification Adapter
export interface INotificationAdapter {
  /**
   * Send a notification to a user or channel
   */
  send(params: {
    to: string | string[]
    subject: string
    message: string
    channel?: 'email' | 'slack' | 'webhook'
    metadata?: Record<string, any>
  }): Promise<void>

  /**
   * Send a notification based on a domain event
   */
  sendFromEvent(event: AllDomainEvents): Promise<void>
}

// Storage Adapter (for exports, backups, etc.)
export interface IStorageAdapter {
  /**
   * Save a file to storage
   */
  save(params: {
    key: string
    data: Buffer | string
    contentType?: string
    metadata?: Record<string, any>
  }): Promise<{ url: string; key: string }>

  /**
   * Retrieve a file from storage
   */
  get(key: string): Promise<{ data: Buffer; contentType?: string }>

  /**
   * Delete a file from storage
   */
  delete(key: string): Promise<void>

  /**
   * Generate a signed URL for temporary access
   */
  getSignedUrl(key: string, expiresIn?: number): Promise<string>
}

// Translation Provider Adapter (for machine translation)
export interface ITranslationProviderAdapter {
  /**
   * Translate text from one language to another
   */
  translate(params: {
    text: string
    sourceLocale: string
    targetLocale: string
    context?: string
  }): Promise<{
    translatedText: string
    confidence?: number
    provider: string
  }>

  /**
   * Detect the language of a text
   */
  detectLanguage(text: string): Promise<{
    locale: string
    confidence: number
  }>

  /**
   * Get supported languages
   */
  getSupportedLanguages(): Promise<string[]>
}

// Metrics Adapter
export interface IMetricsAdapter {
  /**
   * Record a counter metric
   */
  counter(name: string, value?: number, labels?: Record<string, string>): void

  /**
   * Record a gauge metric
   */
  gauge(name: string, value: number, labels?: Record<string, string>): void

  /**
   * Record a histogram metric
   */
  histogram(name: string, value: number, labels?: Record<string, string>): void

  /**
   * Record a timing metric
   */
  timing(name: string, durationMs: number, labels?: Record<string, string>): void

  /**
   * Flush metrics (if batched)
   */
  flush(): Promise<void>
}

// Search Adapter (for full-text search)
export interface ISearchAdapter {
  /**
   * Index a document for search
   */
  index(params: {
    id: string
    type: string
    data: Record<string, any>
  }): Promise<void>

  /**
   * Search for documents
   */
  search(params: {
    query: string
    type?: string
    filters?: Record<string, any>
    limit?: number
    offset?: number
  }): Promise<{
    results: Array<{
      id: string
      score: number
      data: Record<string, any>
    }>
    total: number
  }>

  /**
   * Delete a document from the index
   */
  deleteDocument(id: string): Promise<void>
}

// Webhook Adapter
export interface IWebhookAdapter {
  /**
   * Register a webhook endpoint
   */
  register(params: {
    url: string
    events: string[]
    secret?: string
    metadata?: Record<string, any>
  }): Promise<{ id: string }>

  /**
   * Send an event to a webhook
   */
  send(params: {
    url: string
    event: AllDomainEvents
    secret?: string
  }): Promise<void>

  /**
   * Verify a webhook signature
   */
  verify(params: {
    payload: string
    signature: string
    secret: string
  }): boolean
}
