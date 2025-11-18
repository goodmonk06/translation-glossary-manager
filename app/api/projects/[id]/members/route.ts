import { NextRequest, NextResponse } from 'next/server'
import { z } from 'zod'
import { projectMemberService } from '@/lib/services/project-member.service'
import { apiSuccess, apiError, validationError, handleApiError } from '@/lib/api-response'
import { ProjectMemberRole } from '@prisma/client'

const addMemberSchema = z.object({
  userId: z.string().min(1),
  email: z.string().email(),
  role: z.enum(['OWNER', 'ADMIN', 'TRANSLATOR', 'REVIEWER', 'VIEWER']),
  invitedBy: z.string().optional(),
})

// GET /api/projects/:id/members - List all members
export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const members = await projectMemberService.getProjectMembers(params.id)
    return apiSuccess(members)
  } catch (error) {
    return handleApiError(error)
  }
}

// POST /api/projects/:id/members - Add a member
export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json()
    const data = addMemberSchema.parse(body)

    const member = await projectMemberService.addMember({
      projectId: params.id,
      ...data,
      role: data.role as ProjectMemberRole,
    })

    return apiSuccess(member, 201)
  } catch (error) {
    if (error instanceof z.ZodError) {
      return validationError(error.errors)
    }
    return handleApiError(error)
  }
}
