import { describe, it, expect } from 'vitest'
import {
  AppError,
  NotFoundError,
  ValidationError,
  UnauthorizedError,
  ForbiddenError,
  ConflictError,
} from '@/lib/errors'

describe('Error Classes', () => {
  describe('AppError', () => {
    it('should create an error with message and status code', () => {
      const error = new AppError('Test error', 500, 'TEST_ERROR')

      expect(error.message).toBe('Test error')
      expect(error.statusCode).toBe(500)
      expect(error.code).toBe('TEST_ERROR')
      expect(error.name).toBe('AppError')
    })

    it('should default to status 500 if not provided', () => {
      const error = new AppError('Test error')

      expect(error.statusCode).toBe(500)
    })
  })

  describe('NotFoundError', () => {
    it('should create a 404 error with resource name', () => {
      const error = new NotFoundError('Project')

      expect(error.message).toBe('Project not found')
      expect(error.statusCode).toBe(404)
      expect(error.code).toBe('NOT_FOUND')
      expect(error.name).toBe('NotFoundError')
    })

    it('should use "Resource" as default if not provided', () => {
      const error = new NotFoundError()

      expect(error.message).toBe('Resource not found')
    })
  })

  describe('ValidationError', () => {
    it('should create a 400 error with validation details', () => {
      const details = { field: 'email', issue: 'Invalid format' }
      const error = new ValidationError('Validation failed', details)

      expect(error.message).toBe('Validation failed')
      expect(error.statusCode).toBe(400)
      expect(error.code).toBe('VALIDATION_ERROR')
      expect(error.details).toEqual(details)
    })
  })

  describe('UnauthorizedError', () => {
    it('should create a 401 error', () => {
      const error = new UnauthorizedError()

      expect(error.message).toBe('Unauthorized')
      expect(error.statusCode).toBe(401)
      expect(error.code).toBe('UNAUTHORIZED')
    })

    it('should accept custom message', () => {
      const error = new UnauthorizedError('Token expired')

      expect(error.message).toBe('Token expired')
    })
  })

  describe('ForbiddenError', () => {
    it('should create a 403 error', () => {
      const error = new ForbiddenError()

      expect(error.message).toBe('Forbidden')
      expect(error.statusCode).toBe(403)
      expect(error.code).toBe('FORBIDDEN')
    })
  })

  describe('ConflictError', () => {
    it('should create a 409 error', () => {
      const error = new ConflictError()

      expect(error.message).toBe('Resource already exists')
      expect(error.statusCode).toBe(409)
      expect(error.code).toBe('CONFLICT')
    })

    it('should accept custom message', () => {
      const error = new ConflictError('Project slug already taken')

      expect(error.message).toBe('Project slug already taken')
    })
  })
})
