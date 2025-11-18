/**
 * Translation History Service
 * Manages audit trail of translation changes
 */

import { prisma } from '../prisma'
import { TranslationStatus } from '@prisma/client'
import { eventBus, createEvent, TranslationUpdatedEvent } from '../events'
import { logger } from '../logger'

export interface CreateHistoryParams {
  localeStringId: string
  projectId: string
  key: string
  locale: string
  oldValue?: string
  newValue: string
  oldStatus?: TranslationStatus
  newStatus?: TranslationStatus
  changedBy?: string
  changeType: 'CREATED' | 'UPDATED' | 'DELETED' | 'STATUS_CHANGED'
  metadata?: Record<string, any>
}

export interface HistoryFilter {
  projectId?: string
  localeStringId?: string
  changedBy?: string
  changeType?: string
  from?: Date
  to?: Date
}

export class TranslationHistoryService {
  /**
   * Record a history entry
   */
  async create(params: CreateHistoryParams) {
    logger.debug('Creating history entry', { params })

    const history = await prisma.translationHistory.create({
      data: {
        localeStringId: params.localeStringId,
        projectId: params.projectId,
        key: params.key,
        locale: params.locale,
        oldValue: params.oldValue,
        newValue: params.newValue,
        oldStatus: params.oldStatus,
        newStatus: params.newStatus,
        changedBy: params.changedBy,
        changeType: params.changeType,
        metadata: params.metadata ? JSON.stringify(params.metadata) : null,
      },
    })

    logger.info('History entry created', { historyId: history.id, changeType: params.changeType })

    return history
  }

  /**
   * Get history for a locale string
   */
  async getForString(localeStringId: string, limit: number = 50) {
    return prisma.translationHistory.findMany({
      where: { localeStringId },
      orderBy: { createdAt: 'desc' },
      take: limit,
    })
  }

  /**
   * Get history for a project
   */
  async getForProject(projectId: string, options: { limit?: number; offset?: number } = {}) {
    const { limit = 100, offset = 0 } = options

    const [history, total] = await Promise.all([
      prisma.translationHistory.findMany({
        where: { projectId },
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
        include: {
          localeString: {
            select: {
              key: true,
              locale: true,
            },
          },
        },
      }),
      prisma.translationHistory.count({ where: { projectId } }),
    ])

    return { history, total, limit, offset }
  }

  /**
   * Get filtered history
   */
  async getFiltered(filter: HistoryFilter, options: { limit?: number; offset?: number } = {}) {
    const { limit = 100, offset = 0 } = options

    const where: any = {}

    if (filter.projectId) where.projectId = filter.projectId
    if (filter.localeStringId) where.localeStringId = filter.localeStringId
    if (filter.changedBy) where.changedBy = filter.changedBy
    if (filter.changeType) where.changeType = filter.changeType

    if (filter.from || filter.to) {
      where.createdAt = {}
      if (filter.from) where.createdAt.gte = filter.from
      if (filter.to) where.createdAt.lte = filter.to
    }

    const [history, total] = await Promise.all([
      prisma.translationHistory.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        take: limit,
        skip: offset,
      }),
      prisma.translationHistory.count({ where }),
    ])

    return { history, total, limit, offset }
  }

  /**
   * Get statistics for a project
   */
  async getStats(projectId: string) {
    const history = await prisma.translationHistory.findMany({
      where: { projectId },
      select: {
        changeType: true,
        changedBy: true,
        createdAt: true,
      },
    })

    const byType = history.reduce((acc, h) => {
      acc[h.changeType] = (acc[h.changeType] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    const byUser = history.reduce((acc, h) => {
      const user = h.changedBy || 'system'
      acc[user] = (acc[user] || 0) + 1
      return acc
    }, {} as Record<string, number>)

    // Recent activity (last 7 days)
    const sevenDaysAgo = new Date()
    sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7)

    const recentCount = history.filter((h) => h.createdAt >= sevenDaysAgo).length

    return {
      total: history.length,
      byType,
      byUser,
      recentCount,
    }
  }
}

export const translationHistoryService = new TranslationHistoryService()
