export interface DomainEvent {
  eventName: string
  occurredAt: Date
  aggregateId: string
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredAt: Date

  constructor(
    public readonly eventName: string,
    public readonly aggregateId: string
  ) {
    this.occurredAt = new Date()
  }
}
