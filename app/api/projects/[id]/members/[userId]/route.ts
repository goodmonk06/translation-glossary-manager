import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { projectMemberService } from '@/lib/services/project-member.service'
import { apiSuccess, apiError, validationError, handleApiError } from '@/lib/api-response'
import { ProjectMemberRole } from '@prisma/client'

const updateRoleSchema = z.object({
  role: z.enum(['OWNER', 'ADMIN', 'TRANSLATOR', 'REVIEWER', 'VIEWER']),
  changedBy: z.string().optional(),
})

// GET /api/projects/:id/members/:userId - Get a member
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const member = await projectMemberService.getMember(params.id, params.userId)
    return apiSuccess(member)
  } catch (error) {
    return handleApiError(error)
  }
}

// PATCH /api/projects/:id/members/:userId - Update member role
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const body = await request.json()
    const data = updateRoleSchema.parse(body)

    const member = await projectMemberService.updateRole({
      projectId: params.id,
      userId: params.userId,
      newRole: data.role as ProjectMemberRole,
      changedBy: data.changedBy,
    })

    return apiSuccess(member)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error.errors)
    }
    return handleApiError(error)
  }
}

// DELETE /api/projects/:id/members/:userId - Remove a member
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; userId: string } }
) {
  try {
    const { searchParams } = new URL(request.url)
    const removedBy = searchParams.get('removedBy') || undefined

    await projectMemberService.removeMember(params.id, params.userId, removedBy)

    return apiSuccess({ success: true })
  } catch (error) {
    return handleApiError(error)
  }
}
