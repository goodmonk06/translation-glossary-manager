/**
 * Console Notification Adapter (Default Implementation)
 * Simple console-based notification for development
 */

import { INotificationAdapter } from '../index'
import { AllDomainEvents } from '../../events'
import { logger } from '../../logger'

export class ConsoleNotificationAdapter implements INotificationAdapter {
  async send(params: {
    to: string | string[]
    subject: string
    message: string
    channel?: 'email' | 'slack' | 'webhook'
    metadata?: Record<string, any>
  }): Promise<void> {
    const recipients = Array.isArray(params.to) ? params.to.join(', ') : params.to

    logger.info('Notification sent', {
      to: recipients,
      channel: params.channel || 'console',
      subject: params.subject,
      message: params.message,
      metadata: params.metadata,
    })
  }

  async sendFromEvent(event: AllDomainEvents): Promise<void> {
    switch (event.type) {
      case 'translation.created':
        await this.send({
          to: 'system',
          subject: 'New Translation Created',
          message: `Translation created: ${event.data.key} (${event.data.locale})`,
          metadata: event.data,
        })
        break

      case 'translation.status_changed':
        await this.send({
          to: 'system',
          subject: 'Translation Status Changed',
          message: `${event.data.key}: ${event.data.oldStatus} → ${event.data.newStatus}`,
          metadata: event.data,
        })
        break

      case 'project.member_added':
        await this.send({
          to: event.data.email,
          subject: 'Added to Project',
          message: `You've been added as ${event.data.role}`,
          metadata: event.data,
        })
        break

      default:
        logger.debug('Unhandled event type for notifications', { type: event.type })
    }
  }
}
