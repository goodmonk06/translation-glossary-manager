import { describe, it, expect } from 'vitest'
import { apiSuccess, apiError, notFoundError, validationError } from '@/lib/api-response'

describe('API Response Utilities', () => {
  describe('apiSuccess', () => {
    it('should create a successful response with data', async () => {
      const data = { id: '1', name: 'Test' }
      const response = apiSuccess(data)

      expect(response.status).toBe(200)

      const json = await response.json()
      expect(json).toEqual({
        success: true,
        data,
      })
    })

    it('should accept custom status code', async () => {
      const response = apiSuccess({ created: true }, 201)

      expect(response.status).toBe(201)
    })
  })

  describe('apiError', () => {
    it('should create an error response with message', async () => {
      const response = apiError('Something went wrong', 500)

      expect(response.status).toBe(500)

      const json = await response.json()
      expect(json).toEqual({
        success: false,
        error: {
          message: 'Something went wrong',
          code: undefined,
          details: undefined,
        },
      })
    })

    it('should include error code and details when provided', async () => {
      const response = apiError(
        'Validation failed',
        400,
        'VALIDATION_ERROR',
        { field: 'email' }
      )

      const json = await response.json()
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.details).toEqual({ field: 'email' })
    })
  })

  describe('notFoundError', () => {
    it('should create a 404 response', async () => {
      const response = notFoundError('Project')

      expect(response.status).toBe(404)

      const json = await response.json()
      expect(json.error.message).toBe('Project not found')
      expect(json.error.code).toBe('NOT_FOUND')
    })
  })

  describe('validationError', () => {
    it('should create a 400 validation error response', async () => {
      const details = [{ field: 'email', message: 'Invalid email' }]
      const response = validationError(details)

      expect(response.status).toBe(400)

      const json = await response.json()
      expect(json.error.code).toBe('VALIDATION_ERROR')
      expect(json.error.details).toEqual(details)
    })
  })
})
