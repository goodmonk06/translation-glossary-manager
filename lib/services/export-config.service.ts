/**
 * Export Config Service
 * Manages export configurations and generates exports
 */

import { prisma } from '../prisma'
import { logger } from '../logger'
import { NotFoundError } from '../errors'

export interface CreateExportConfigParams {
  projectId: string
  name: string
  description?: string
  format?: string
  filters?: Record<string, any>
  transforms?: Record<string, any>
  outputOptions?: Record<string, any>
  createdBy?: string
}

export interface UpdateExportConfigParams {
  name?: string
  description?: string
  format?: string
  filters?: Record<string, any>
  transforms?: Record<string, any>
  outputOptions?: Record<string, any>
  isActive?: boolean
}

export interface ExportFilters {
  locale?: string | string[]
  status?: string | string[]
  keyPattern?: string
  updatedAfter?: Date
  updatedBefore?: Date
}

export class ExportConfigService {
  /**
   * Create an export configuration
   */
  async create(params: CreateExportConfigParams) {
    logger.debug('Creating export config', { params })

    const config = await prisma.exportConfig.create({
      data: {
        projectId: params.projectId,
        name: params.name,
        description: params.description,
        format: params.format || 'JSON',
        filters: params.filters ? JSON.stringify(params.filters) : null,
        transforms: params.transforms ? JSON.stringify(params.transforms) : null,
        outputOptions: params.outputOptions ? JSON.stringify(params.outputOptions) : null,
        createdBy: params.createdBy,
      },
    })

    logger.info('Export config created', { configId: config.id, name: params.name })

    return config
  }

  /**
   * Update an export configuration
   */
  async update(id: string, params: UpdateExportConfigParams) {
    logger.debug('Updating export config', { id, params })

    const data: any = {}

    if (params.name !== undefined) data.name = params.name
    if (params.description !== undefined) data.description = params.description
    if (params.format !== undefined) data.format = params.format
    if (params.filters !== undefined) data.filters = JSON.stringify(params.filters)
    if (params.transforms !== undefined) data.transforms = JSON.stringify(params.transforms)
    if (params.outputOptions !== undefined) data.outputOptions = JSON.stringify(params.outputOptions)
    if (params.isActive !== undefined) data.isActive = params.isActive

    const config = await prisma.exportConfig.update({
      where: { id },
      data,
    })

    logger.info('Export config updated', { configId: id })

    return config
  }

  /**
   * Delete an export configuration
   */
  async delete(id: string) {
    await prisma.exportConfig.delete({
      where: { id },
    })

    logger.info('Export config deleted', { configId: id })
  }

  /**
   * Get an export configuration
   */
  async get(id: string) {
    const config = await prisma.exportConfig.findUnique({
      where: { id },
    })

    if (!config) {
      throw new NotFoundError('Export configuration')
    }

    return config
  }

  /**
   * Get all configurations for a project
   */
  async getForProject(projectId: string, activeOnly: boolean = false) {
    const where: any = { projectId }
    if (activeOnly) where.isActive = true

    return prisma.exportConfig.findMany({
      where,
      orderBy: { createdAt: 'desc' },
    })
  }

  /**
   * Generate export using configuration
   */
  async generateExport(configId: string) {
    const config = await this.get(configId)

    // Parse configuration
    const filters = config.filters ? JSON.parse(config.filters) : {}
    const transforms = config.transforms ? JSON.parse(config.transforms) : {}
    const outputOptions = config.outputOptions ? JSON.parse(config.outputOptions) : {}

    logger.debug('Generating export', { configId, filters, format: config.format })

    // Build query
    const where: any = { projectId: config.projectId }

    if (filters.locale) {
      if (Array.isArray(filters.locale)) {
        where.locale = { in: filters.locale }
      } else {
        where.locale = filters.locale
      }
    }

    if (filters.status) {
      if (Array.isArray(filters.status)) {
        where.status = { in: filters.status }
      } else {
        where.status = filters.status
      }
    }

    if (filters.keyPattern) {
      where.key = { contains: filters.keyPattern }
    }

    if (filters.updatedAfter || filters.updatedBefore) {
      where.updatedAt = {}
      if (filters.updatedAfter) where.updatedAt.gte = new Date(filters.updatedAfter)
      if (filters.updatedBefore) where.updatedAt.lte = new Date(filters.updatedBefore)
    }

    // Fetch data
    const strings = await prisma.localeString.findMany({
      where,
      select: {
        key: true,
        locale: true,
        value: true,
        description: true,
        status: true,
        updatedAt: true,
      },
    })

    // Apply transforms
    let data: any = strings

    if (transforms.groupByLocale) {
      data = this.groupByLocale(strings)
    }

    if (transforms.flattenKeys) {
      data = this.flattenKeys(data)
    }

    // Format output
    let output: string

    switch (config.format.toUpperCase()) {
      case 'JSON':
        output = JSON.stringify(data, null, outputOptions.pretty ? 2 : 0)
        break

      case 'CSV':
        output = this.toCSV(strings)
        break

      case 'YAML':
        output = this.toYAML(data)
        break

      default:
        output = JSON.stringify(data)
    }

    // Update usage stats
    await prisma.exportConfig.update({
      where: { id: configId },
      data: {
        lastUsedAt: new Date(),
        useCount: { increment: 1 },
      },
    })

    logger.info('Export generated', { configId, recordCount: strings.length, format: config.format })

    return {
      config,
      data: output,
      recordCount: strings.length,
      format: config.format,
    }
  }

  // Helper methods

  private groupByLocale(strings: any[]) {
    const grouped: Record<string, Record<string, string>> = {}

    for (const str of strings) {
      if (!grouped[str.locale]) {
        grouped[str.locale] = {}
      }
      grouped[str.locale][str.key] = str.value
    }

    return grouped
  }

  private flattenKeys(data: any) {
    // Simple key flattening (can be enhanced)
    return data
  }

  private toCSV(strings: any[]): string {
    if (strings.length === 0) return ''

    const headers = ['key', 'locale', 'value', 'description', 'status', 'updatedAt']
    const rows = strings.map((s) => [
      s.key,
      s.locale,
      this.escapeCSV(s.value),
      s.description || '',
      s.status,
      s.updatedAt.toISOString(),
    ])

    const lines = [
      headers.join(','),
      ...rows.map((row) => row.join(',')),
    ]

    return lines.join('\n')
  }

  private escapeCSV(value: string): string {
    if (value.includes(',') || value.includes('"') || value.includes('\n')) {
      return `"${value.replace(/"/g, '""')}"`
    }
    return value
  }

  private toYAML(data: any): string {
    // Simple YAML conversion (can use a library for production)
    return JSON.stringify(data, null, 2)
  }
}

export const exportConfigService = new ExportConfigService()
