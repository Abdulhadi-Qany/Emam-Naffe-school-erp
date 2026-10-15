import { BaseDomainEvent } from '@/src/shared/domain/base';

export class StaffHiredEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly schoolId: string,
    public readonly employeeCode: string,
  ) {
    super('StaffHired', aggregateId);
  }
}

export class StaffUpdatedEvent extends BaseDomainEvent {
  constructor(aggregateId: string, public readonly schoolId: string) {
    super('StaffUpdated', aggregateId);
  }
}

export class StaffTerminatedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly schoolId: string,
    public readonly reason?: string,
  ) {
    super('StaffTerminated', aggregateId);
  }
}
