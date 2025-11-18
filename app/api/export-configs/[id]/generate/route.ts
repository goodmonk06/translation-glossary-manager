import { NextRequest } from 'next/server'
import { exportConfigService } from '@/lib/services/export-config.service'
import { apiSuccess, handleApiError } from '@/lib/api-response'
import { eventBus, createEvent } from '@/lib/events'

// POST /api/export-configs/:id/generate - Generate export
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const result = await exportConfigService.generateExport(params.id)

    // Emit event
    await eventBus.emit(
      createEvent('export.generated', {
        projectId: result.config.projectId,
        projectSlug: '', // Would need to fetch from project
        format: result.format,
        configId: params.id,
        recordCount: result.recordCount,
      })
    )

    return apiSuccess({
      config: result.config,
      recordCount: result.recordCount,
      format: result.format,
      data: result.data,
    })
  } catch (error) {
    return handleApiError(error)
  }
}
