import { describe, it, expect, beforeEach, vi } from 'vitest'
import { TranslationClient } from '@/sdk/client'

// Mock fetch
global.fetch = vi.fn()

describe('TranslationClient', () => {
  let client: TranslationClient

  beforeEach(() => {
    client = new TranslationClient({
      baseUrl: 'http://localhost:3000',
      projectSlug: 'test-project',
      locale: 'en-US',
      cache: true,
    })
    vi.clearAllMocks()
  })

  describe('load', () => {
    it('should fetch translations from the API', async () => {
      const mockTranslations = {
        'app.welcome': 'Welcome',
        'app.login': 'Login',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslations,
      } as Response)

      await client.load()

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/export/test-project?locale=en-US'
      )
      expect(client.getAll()).toEqual(mockTranslations)
    })

    it('should throw error if API request fails', async () => {
      vi.mocked(fetch).mockResolvedValueOnce({
        ok: false,
        statusText: 'Not Found',
      } as Response)

      await expect(client.load()).rejects.toThrow('Failed to load translations: Not Found')
    })
  })

  describe('t', () => {
    beforeEach(async () => {
      const mockTranslations = {
        'app.welcome': 'Welcome to our app',
        'app.login': 'Login',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslations,
      } as Response)

      await client.load()
    })

    it('should return translation for existing key', () => {
      expect(client.t('app.welcome')).toBe('Welcome to our app')
      expect(client.t('app.login')).toBe('Login')
    })

    it('should return fallback for missing key', () => {
      expect(client.t('app.missing', 'Fallback')).toBe('Fallback')
    })

    it('should return key itself if no fallback provided', () => {
      expect(client.t('app.missing')).toBe('app.missing')
    })
  })

  describe('t_interpolate', () => {
    beforeEach(async () => {
      const mockTranslations = {
        'greeting': 'Hello, {name}!',
        'welcome': 'Welcome {user}, you have {count} messages',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslations,
      } as Response)

      await client.load()
    })

    it('should interpolate single parameter', () => {
      expect(client.t_interpolate('greeting', { name: 'John' })).toBe('Hello, John!')
    })

    it('should interpolate multiple parameters', () => {
      expect(
        client.t_interpolate('welcome', { user: 'Alice', count: 5 })
      ).toBe('Welcome Alice, you have 5 messages')
    })

    it('should handle numeric values', () => {
      expect(
        client.t_interpolate('welcome', { user: 'Bob', count: 42 })
      ).toBe('Welcome Bob, you have 42 messages')
    })
  })

  describe('has', () => {
    beforeEach(async () => {
      const mockTranslations = {
        'app.welcome': 'Welcome',
      }

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockTranslations,
      } as Response)

      await client.load()
    })

    it('should return true for existing key', () => {
      expect(client.has('app.welcome')).toBe(true)
    })

    it('should return false for missing key', () => {
      expect(client.has('app.missing')).toBe(false)
    })
  })

  describe('loadGlossary', () => {
    it('should fetch glossary from the API', async () => {
      const mockGlossary = [
        {
          id: '1',
          sourceTerm: 'dashboard',
          sourceLocale: 'en-US',
          targetTerm: 'ダッシュボード',
          targetLocale: 'ja-JP',
          notes: 'Use katakana',
          tags: ['ui'],
        },
      ]

      vi.mocked(fetch).mockResolvedValueOnce({
        ok: true,
        json: async () => mockGlossary,
      } as Response)

      await client.loadGlossary('en-US', 'ja-JP')

      expect(fetch).toHaveBeenCalledWith(
        'http://localhost:3000/api/glossary/test-project?sourceLocale=en-US&targetLocale=ja-JP'
      )
      expect(client.getGlossary()).toEqual(mockGlossary)
    })
  })

  describe('reload', () => {
    it('should reload translations from the API', async () => {
      const firstTranslations = { 'app.v1': 'Version 1' }
      const secondTranslations = { 'app.v2': 'Version 2' }

      vi.mocked(fetch)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => firstTranslations,
        } as Response)
        .mockResolvedValueOnce({
          ok: true,
          json: async () => secondTranslations,
        } as Response)

      await client.load()
      expect(client.t('app.v1')).toBe('Version 1')

      await client.reload()
      expect(client.t('app.v2')).toBe('Version 2')
      expect(client.has('app.v1')).toBe(false)
    })
  })
})
