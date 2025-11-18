/**
 * Translation SDK Client
 *
 * A minimal JavaScript client for fetching translations from the
 * translation-glossary-manager backend.
 */

export interface TranslationClientOptions {
  /** Base URL of the translation service */
  baseUrl: string
  /** Project slug to fetch translations for */
  projectSlug: string
  /** Locale to use for translations (e.g., 'en-US', 'ja-JP') */
  locale: string
  /** Optional: Cache translations in memory */
  cache?: boolean
}

export interface GlossaryTerm {
  id: string
  sourceTerm: string
  sourceLocale: string
  targetLocale: string
  targetTerm: string
  notes?: string
  tags: string[]
}

export class TranslationClient {
  private baseUrl: string
  private projectSlug: string
  private locale: string
  private translations: Record<string, string> = {}
  private glossary: GlossaryTerm[] = []
  private loaded = false
  private cache: boolean

  constructor(options: TranslationClientOptions) {
    this.baseUrl = options.baseUrl.replace(/\/$/, '') // Remove trailing slash
    this.projectSlug = options.projectSlug
    this.locale = options.locale
    this.cache = options.cache ?? true
  }

  /**
   * Load translations from the backend
   */
  async load(): Promise<void> {
    try {
      const url = `${this.baseUrl}/api/export/${this.projectSlug}?locale=${encodeURIComponent(this.locale)}`
      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to load translations: ${response.statusText}`)
      }

      this.translations = await response.json()
      this.loaded = true
    } catch (error) {
      console.error('Error loading translations:', error)
      throw error
    }
  }

  /**
   * Load glossary from the backend
   */
  async loadGlossary(sourceLocale?: string, targetLocale?: string): Promise<void> {
    try {
      const params = new URLSearchParams()
      if (sourceLocale) params.set('sourceLocale', sourceLocale)
      if (targetLocale) params.set('targetLocale', targetLocale)

      const queryString = params.toString()
      const url = `${this.baseUrl}/api/glossary/${this.projectSlug}${queryString ? `?${queryString}` : ''}`

      const response = await fetch(url)

      if (!response.ok) {
        throw new Error(`Failed to load glossary: ${response.statusText}`)
      }

      this.glossary = await response.json()
    } catch (error) {
      console.error('Error loading glossary:', error)
      throw error
    }
  }

  /**
   * Get a translation by key
   * @param key - The translation key
   * @param fallback - Optional fallback value if key is not found
   */
  t(key: string, fallback?: string): string {
    if (!this.loaded && this.cache) {
      console.warn('Translations not loaded yet. Call load() first.')
      return fallback || key
    }

    return this.translations[key] ?? fallback ?? key
  }

  /**
   * Get a translation with interpolation
   * @param key - The translation key
   * @param params - Parameters to interpolate into the translation
   * @param fallback - Optional fallback value
   *
   * Example: t('hello_name', { name: 'John' }) with string "Hello, {name}!" returns "Hello, John!"
   */
  t_interpolate(key: string, params: Record<string, string | number>, fallback?: string): string {
    let translation = this.t(key, fallback)

    Object.keys(params).forEach((paramKey) => {
      const value = params[paramKey]
      translation = translation.replace(new RegExp(`\\{${paramKey}\\}`, 'g'), String(value))
    })

    return translation
  }

  /**
   * Get all translations
   */
  getAll(): Record<string, string> {
    return { ...this.translations }
  }

  /**
   * Get glossary terms
   */
  getGlossary(): GlossaryTerm[] {
    return [...this.glossary]
  }

  /**
   * Reload translations from the backend
   */
  async reload(): Promise<void> {
    this.loaded = false
    await this.load()
  }

  /**
   * Check if a key exists
   */
  has(key: string): boolean {
    return key in this.translations
  }
}

/**
 * Create a translation client instance
 */
export function createTranslationClient(options: TranslationClientOptions): TranslationClient {
  return new TranslationClient(options)
}

// Export a default instance creator for convenience
export default createTranslationClient
