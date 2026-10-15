/**
 * SHARED KERNEL — Domain base classes.
 * Pure. Zero framework / DB / HTTP dependencies.
 * Every bounded context inherits from these — no duplication.
 */

export abstract class Entity<TProps> {
  protected readonly props: TProps;

  protected constructor(props: TProps) {
    // NOTE: intentionally NOT frozen — aggregates mutate status/totals via
    // behavior methods (terminate/collectPayment). Encapsulation is enforced
    // by private constructor + behavior-only mutation, not Object.freeze.
    this.props = { ...props };
  }

  public toProps(): TProps {
    return { ...this.props };
  }

  public equals(other: Entity<TProps>): boolean {
    return JSON.stringify(this.props) === JSON.stringify(other.props);
  }
}

export interface DomainEvent {
  eventName: string;
  occurredAt: Date;
  aggregateId: string;
}

export abstract class BaseDomainEvent implements DomainEvent {
  public readonly occurredAt: Date = new Date();
  constructor(
    public readonly eventName: string,
    public readonly aggregateId: string,
  ) {}
}

export abstract class AggregateRoot<TProps> extends Entity<TProps> {
  private domainEvents: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this.domainEvents.push(event);
  }

  public pullDomainEvents(): DomainEvent[] {
    const events = [...this.domainEvents];
    this.domainEvents = [];
    return events;
  }

  public clearEvents(): void {
    this.domainEvents = [];
  }
}

export abstract class ValueObject<T> {
  protected readonly value: T;
  protected constructor(value: T) {
    this.value = value;
  }
  public getValue(): T {
    return this.value;
  }
  public equals(other: ValueObject<T>): boolean {
    return this.value === other.value;
  }
  public toString(): string {
    return String(this.value);
  }
}
