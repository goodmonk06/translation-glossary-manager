import { NextRequest, NextResponse } from 'next/server'
import { ZodError } from 'zod'
import { AppError } from './errors'
import { apiError, apiSuccess, handleApiError } from './api-response'

/**
 * API Route Handler Wrapper
 * Wraps API route handlers with consistent error handling
 */
export function withApiHandler<T = any>(
  handler: (request: NextRequest, context?: any) => Promise<Response>
) {
  return async (request: NextRequest, context?: any): Promise<Response> => {
    try {
      return await handler(request, context)
    } catch (error) {
      // Handle Zod validation errors
      if (error instanceof ZodError) {
        return apiError(
          'Validation failed',
          400,
          'VALIDATION_ERROR',
          error.errors
        )
      }

      // Handle custom app errors
      if (error instanceof AppError) {
        return apiError(error.message, error.statusCode, error.code)
      }

      // Handle all other errors
      return handleApiError(error)
    }
  }
}

/**
 * Async handler with automatic error catching
 */
export async function catchAsync<T>(
  fn: () => Promise<T>
): Promise<T> {
  try {
    return await fn()
  } catch (error) {
    throw error
  }
}
