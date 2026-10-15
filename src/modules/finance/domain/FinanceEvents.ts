import { BaseDomainEvent } from '@/src/shared/domain/base';

export class InvoiceIssuedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly schoolId: string,
    public readonly invoiceNumber: string,
    public readonly totalAmount: number,
  ) {
    super('InvoiceIssued', aggregateId);
  }
}

export class PaymentRecordedEvent extends BaseDomainEvent {
  constructor(
    aggregateId: string,
    public readonly schoolId: string,
    public readonly receiptNumber: string,
    public readonly amount: number,
  ) {
    super('PaymentRecorded', aggregateId);
  }
}

export class InvoiceWaivedEvent extends BaseDomainEvent {
  constructor(aggregateId: string, public readonly schoolId: string, public readonly reason?: string) {
    super('InvoiceWaived', aggregateId);
  }
}
