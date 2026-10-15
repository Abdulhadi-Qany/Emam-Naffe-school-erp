import type { DomainEvent } from '@/src/domain/events'

export interface IEventPublisher {
  publish(event: DomainEvent): Promise<void>
  publishAll(events: DomainEvent[]): Promise<void>
}
