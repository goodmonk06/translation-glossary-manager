/**
 * Project Member Service
 * Manages project membership and roles
 */

import { prisma } from '../prisma'
import { ProjectMemberRole } from '@prisma/client'
import { eventBus, createEvent } from '../events'
import { logger } from '../logger'
import { ConflictError, NotFoundError, ForbiddenError } from '../errors'

export interface AddMemberParams {
  projectId: string
  userId: string
  email: string
  role: ProjectMemberRole
  invitedBy?: string
}

export interface UpdateMemberRoleParams {
  projectId: string
  userId: string
  newRole: ProjectMemberRole
  changedBy?: string
}

export class ProjectMemberService {
  /**
   * Add a member to a project
   */
  async addMember(params: AddMemberParams) {
    logger.debug('Adding member to project', params)

    // Check if member already exists
    const existing = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: params.userId,
        },
      },
    })

    if (existing) {
      throw new ConflictError('User is already a member of this project')
    }

    // Create member
    const member = await prisma.projectMember.create({
      data: {
        projectId: params.projectId,
        userId: params.userId,
        email: params.email,
        role: params.role,
        invitedBy: params.invitedBy,
      },
    })

    // Emit event
    await eventBus.emit(
      createEvent('project.member_added', {
        projectId: params.projectId,
        userId: params.userId,
        email: params.email,
        role: params.role,
        invitedBy: params.invitedBy,
      })
    )

    logger.info('Member added to project', {
      projectId: params.projectId,
      userId: params.userId,
      role: params.role,
    })

    return member
  }

  /**
   * Remove a member from a project
   */
  async removeMember(projectId: string, userId: string, removedBy?: string) {
    logger.debug('Removing member from project', { projectId, userId })

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    })

    if (!member) {
      throw new NotFoundError('Project member')
    }

    // Don't allow removing the last owner
    if (member.role === ProjectMemberRole.OWNER) {
      const ownerCount = await prisma.projectMember.count({
        where: {
          projectId,
          role: ProjectMemberRole.OWNER,
        },
      })

      if (ownerCount <= 1) {
        throw new ForbiddenError('Cannot remove the last owner of a project')
      }
    }

    await prisma.projectMember.delete({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    })

    // Emit event
    await eventBus.emit(
      createEvent('project.member_removed', {
        projectId,
        userId,
        removedBy,
      })
    )

    logger.info('Member removed from project', { projectId, userId })
  }

  /**
   * Update a member's role
   */
  async updateRole(params: UpdateMemberRoleParams) {
    logger.debug('Updating member role', params)

    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: params.userId,
        },
      },
    })

    if (!member) {
      throw new NotFoundError('Project member')
    }

    const oldRole = member.role

    // Don't allow changing the last owner's role
    if (oldRole === ProjectMemberRole.OWNER && params.newRole !== ProjectMemberRole.OWNER) {
      const ownerCount = await prisma.projectMember.count({
        where: {
          projectId: params.projectId,
          role: ProjectMemberRole.OWNER,
        },
      })

      if (ownerCount <= 1) {
        throw new ForbiddenError('Cannot change the role of the last owner')
      }
    }

    const updated = await prisma.projectMember.update({
      where: {
        projectId_userId: {
          projectId: params.projectId,
          userId: params.userId,
        },
      },
      data: {
        role: params.newRole,
        lastActive: new Date(),
      },
    })

    // Emit event
    await eventBus.emit(
      createEvent('project.member_role_changed', {
        projectId: params.projectId,
        userId: params.userId,
        oldRole,
        newRole: params.newRole,
        changedBy: params.changedBy,
      })
    )

    logger.info('Member role updated', {
      projectId: params.projectId,
      userId: params.userId,
      oldRole,
      newRole: params.newRole,
    })

    return updated
  }

  /**
   * Get all members of a project
   */
  async getProjectMembers(projectId: string) {
    return prisma.projectMember.findMany({
      where: { projectId },
      orderBy: [{ role: 'asc' }, { joinedAt: 'asc' }],
    })
  }

  /**
   * Get a specific member
   */
  async getMember(projectId: string, userId: string) {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    })

    if (!member) {
      throw new NotFoundError('Project member')
    }

    return member
  }

  /**
   * Check if user has role
   */
  async hasRole(projectId: string, userId: string, role: ProjectMemberRole): Promise<boolean> {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    })

    return member?.role === role
  }

  /**
   * Check if user has at least a certain role level
   */
  async hasMinRole(projectId: string, userId: string, minRole: ProjectMemberRole): Promise<boolean> {
    const member = await prisma.projectMember.findUnique({
      where: {
        projectId_userId: {
          projectId,
          userId,
        },
      },
    })

    if (!member) return false

    const roleHierarchy: ProjectMemberRole[] = [
      ProjectMemberRole.VIEWER,
      ProjectMemberRole.TRANSLATOR,
      ProjectMemberRole.REVIEWER,
      ProjectMemberRole.ADMIN,
      ProjectMemberRole.OWNER,
    ]

    const memberIndex = roleHierarchy.indexOf(member.role)
    const minIndex = roleHierarchy.indexOf(minRole)

    return memberIndex >= minIndex
  }

  /**
   * Update last active time
   */
  async updateLastActive(projectId: string, userId: string) {
    await prisma.projectMember.updateMany({
      where: {
        projectId,
        userId,
      },
      data: {
        lastActive: new Date(),
      },
    })
  }
}

export const projectMemberService = new ProjectMemberService()
