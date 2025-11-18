/**
 * Domain Events System
 * Type-safe event system for decoupling domain logic
 */

import { TranslationStatus, ProjectMemberRole } from '@prisma/client'

// Base event interface
export interface DomainEvent {
  type: string
  timestamp: Date
  metadata?: Record<string, any>
}

// Translation Events
export interface TranslationCreatedEvent extends DomainEvent {
  type: 'translation.created'
  data: {
    id: string
    projectId: string
    key: string
    locale: string
    value: string
    createdBy?: string
  }
}

export interface TranslationUpdatedEvent extends DomainEvent {
  type: 'translation.updated'
  data: {
    id: string
    projectId: string
    key: string
    locale: string
    oldValue: string
    newValue: string
    updatedBy?: string
  }
}

export interface TranslationStatusChangedEvent extends DomainEvent {
  type: 'translation.status_changed'
  data: {
    id: string
    projectId: string
    key: string
    locale: string
    oldStatus: TranslationStatus
    newStatus: TranslationStatus
    changedBy?: string
  }
}

export interface TranslationDeletedEvent extends DomainEvent {
  type: 'translation.deleted'
  data: {
    id: string
    projectId: string
    key: string
    locale: string
    deletedBy?: string
  }
}

// Project Events
export interface ProjectCreatedEvent extends DomainEvent {
  type: 'project.created'
  data: {
    id: string
    name: string
    slug: string
    createdBy?: string
  }
}

export interface ProjectUpdatedEvent extends DomainEvent {
  type: 'project.updated'
  data: {
    id: string
    updates: Record<string, any>
    updatedBy?: string
  }
}

export interface ProjectDeletedEvent extends DomainEvent {
  type: 'project.deleted'
  data: {
    id: string
    slug: string
    deletedBy?: string
  }
}

// Project Member Events
export interface ProjectMemberAddedEvent extends DomainEvent {
  type: 'project.member_added'
  data: {
    projectId: string
    userId: string
    email: string
    role: ProjectMemberRole
    invitedBy?: string
  }
}

export interface ProjectMemberRoleChangedEvent extends DomainEvent {
  type: 'project.member_role_changed'
  data: {
    projectId: string
    userId: string
    oldRole: ProjectMemberRole
    newRole: ProjectMemberRole
    changedBy?: string
  }
}

export interface ProjectMemberRemovedEvent extends DomainEvent {
  type: 'project.member_removed'
  data: {
    projectId: string
    userId: string
    removedBy?: string
  }
}

// Glossary Events
export interface GlossaryTermCreatedEvent extends DomainEvent {
  type: 'glossary.created'
  data: {
    id: string
    projectId: string
    sourceTerm: string
    targetTerm: string
    sourceLocale: string
    targetLocale: string
    createdBy?: string
  }
}

export interface GlossaryTermUpdatedEvent extends DomainEvent {
  type: 'glossary.updated'
  data: {
    id: string
    projectId: string
    updates: Record<string, any>
    updatedBy?: string
  }
}

// Export Events
export interface ExportGeneratedEvent extends DomainEvent {
  type: 'export.generated'
  data: {
    projectId: string
    projectSlug: string
    locale?: string
    format?: string
    configId?: string
    recordCount: number
  }
}

// Union type of all events
export type AllDomainEvents =
  | TranslationCreatedEvent
  | TranslationUpdatedEvent
  | TranslationStatusChangedEvent
  | TranslationDeletedEvent
  | ProjectCreatedEvent
  | ProjectUpdatedEvent
  | ProjectDeletedEvent
  | ProjectMemberAddedEvent
  | ProjectMemberRoleChangedEvent
  | ProjectMemberRemovedEvent
  | GlossaryTermCreatedEvent
  | GlossaryTermUpdatedEvent
  | ExportGeneratedEvent

// Event Handler type
export type EventHandler<T extends DomainEvent = DomainEvent> = (
  event: T
) => Promise<void> | void

// Event Bus
class EventBus {
  private handlers: Map<string, EventHandler[]> = new Map()

  /**
   * Register an event handler
   */
  on<T extends AllDomainEvents>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType) || []
    handlers.push(handler as EventHandler)
    this.handlers.set(eventType, handlers)
  }

  /**
   * Remove an event handler
   */
  off<T extends AllDomainEvents>(
    eventType: T['type'],
    handler: EventHandler<T>
  ): void {
    const handlers = this.handlers.get(eventType) || []
    const filtered = handlers.filter((h) => h !== handler)
    this.handlers.set(eventType, filtered)
  }

  /**
   * Emit an event
   */
  async emit<T extends AllDomainEvents>(event: T): Promise<void> {
    const handlers = this.handlers.get(event.type) || []

    // Execute all handlers (don't wait for them)
    const promises = handlers.map((handler) =>
      Promise.resolve(handler(event)).catch((error) => {
        console.error(`Error in event handler for ${event.type}:`, error)
      })
    )

    await Promise.all(promises)
  }

  /**
   * Get all registered event types
   */
  getEventTypes(): string[] {
    return Array.from(this.handlers.keys())
  }

  /**
   * Clear all handlers
   */
  clear(): void {
    this.handlers.clear()
  }
}

// Singleton event bus
export const eventBus = new EventBus()

/**
 * Helper to create events with timestamp
 */
export function createEvent<T extends AllDomainEvents>(
  type: T['type'],
  data: T['data'],
  metadata?: Record<string, any>
): T {
  return {
    type,
    data,
    timestamp: new Date(),
    metadata,
  } as T
}
