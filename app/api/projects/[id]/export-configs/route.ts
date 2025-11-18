import { NextRequest } from 'next/server'
import { z } from 'zod'
import { exportConfigService } from '@/lib/services/export-config.service'
import { apiSuccess, validationError, handleApiError } from '@/lib/api-response'

const createConfigSchema = z.object({
  name: z.string().min(1),
  description: z.string().optional(),
  format: z.enum(['JSON', 'CSV', 'YAML', 'XLIFF']).optional(),
  filters: z.record(z.any()).optional(),
  transforms: z.record(z.any()).optional(),
  outputOptions: z.record(z.any()).optional(),
  createdBy: z.string().optional(),
})

// GET /api/projects/:id/export-configs - List export configs
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const activeOnly = searchParams.get('activeOnly') === 'true'

    const configs = await exportConfigService.getForProject(params.id, activeOnly)

    return apiSuccess(configs)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/projects/:id/export-configs - Create export config
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = createConfigSchema.parse(body)

    const config = await exportConfigService.create({
      projectId: params.id,
      ...data,
    })

    return apiSuccess(config, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error.errors)
    }
    return handleApiError(error)
  }
}
