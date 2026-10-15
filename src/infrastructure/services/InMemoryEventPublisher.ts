import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher'
import type { DomainEvent } from '@/src/domain/events'
import type { ILogger } from '@/src/application/ports/input/ILogger'

/**
 * In-memory event publisher. In production this would publish to a message
 * bus (e.g. Redis/RabbitMQ). Kept simple and swappable via the port.
 */
export class InMemoryEventPublisher implements IEventPublisher {
  public readonly published: DomainEvent[] = []

  constructor(private readonly logger?: ILogger) {}

  public async publish(event: DomainEvent): Promise<void> {
    this.published.push(event)
    this.logger?.debug('Domain event published', {
      event: event.eventName,
      aggregateId: event.aggregateId,
    })
  }

  public async publishAll(events: DomainEvent[]): Promise<void> {
    for (const event of events) {
      await this.publish(event)
    }
  }
}
