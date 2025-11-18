/**
 * Centralized API Response Utilities
 * Ensures consistent API response format across all endpoints
 */

export interface ApiSuccessResponse<T = any> {
  success: true
  data: T
}

export interface ApiErrorResponse {
  success: false
  error: {
    message: string
    code?: string
    details?: any
  }
}

export type ApiResponse<T = any> = ApiSuccessResponse<T> | ApiErrorResponse

/**
 * Create a successful API response
 */
export function apiSuccess<T>(data: T, status: number = 200): Response {
  return Response.json(
    {
      success: true,
      data,
    } as ApiSuccessResponse<T>,
    { status }
  )
}

/**
 * Create an error API response
 */
export function apiError(
  message: string,
  status: number = 500,
  code?: string,
  details?: any
): Response {
  return Response.json(
    {
      success: false,
      error: {
        message,
        code,
        details,
      },
    } as ApiErrorResponse,
    { status }
  )
}

/**
 * Handle API errors in a consistent way
 */
export function handleApiError(error: unknown): Response {
  console.error('API Error:', error)

  if (error instanceof Error) {
    // Check if it's a Prisma error
    if (error.constructor.name.includes('Prisma')) {
      return apiError('Database error', 500, 'DATABASE_ERROR')
    }

    return apiError(error.message, 500, 'INTERNAL_ERROR')
  }

  return apiError('An unexpected error occurred', 500, 'UNKNOWN_ERROR')
}

/**
 * Validation error response
 */
export function validationError(details: any): Response {
  return apiError('Validation failed', 400, 'VALIDATION_ERROR', details)
}

/**
 * Not found error response
 */
export function notFoundError(resource: string = 'Resource'): Response {
  return apiError(`${resource} not found`, 404, 'NOT_FOUND')
}
