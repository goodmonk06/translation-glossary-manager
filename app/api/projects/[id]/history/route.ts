import { NextRequest } from 'next/server'
import { translationHistoryService } from '@/lib/services/translation-history.service'
import { apiSuccess, handleApiError } from '@/lib/api-response'

// GET /api/projects/:id/history - Get translation history
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = parseInt(searchParams.get('offset') || '0')

    const result = await translationHistoryService.getForProject(params.id, {
      limit,
      offset,
    })

    return apiSuccess(result)
  } catch (error) {
    return handleApiError(error)
  }
}
