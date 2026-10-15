import { DomainError } from '@/src/domain/errors/DomainError';
import { Money } from '@/src/domain/value-objects/Money';

export enum InvoiceStatus {
  PENDING = 'pending',
  PARTIAL = 'partial',
  PAID = 'paid',
  OVERDUE = 'overdue',
  WAIVED = 'waived',
  CANCELLED = 'cancelled',
}

export enum PaymentMethod {
  CASH = 'cash',
  BANK_TRANSFER = 'bank_transfer',
  CHEQUE = 'cheque',
  CARD = 'card',
  MOBILE_PAYMENT = 'mobile_payment',
}

export enum PaymentStatus {
  PENDING = 'pending',
  COMPLETED = 'completed',
  FAILED = 'failed',
  REFUNDED = 'refunded',
}

/** InvoiceId — UUID identity. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class InvoiceId {
  private readonly value: string;
  private constructor(value: string) {
    this.value = value;
  }
  public static generate(): InvoiceId {
    return new InvoiceId(crypto.randomUUID());
  }
  public static fromString(value: string): InvoiceId {
    if (!value?.trim()) throw new DomainError('InvoiceId cannot be empty');
    if (!UUID_PATTERN.test(value)) throw new DomainError(`Invalid InvoiceId: ${value}`);
    return new InvoiceId(value);
  }
  public getValue(): string {
    return this.value;
  }
  public toString(): string {
    return this.value;
  }
}

/** InvoiceNumber — INV-1403-0001, unique globally. */
export class InvoiceNumber {
  private readonly value: string;
  private constructor(value: string) {
    this.value = value;
  }
  public static create(value: string): InvoiceNumber {
    const cleaned = value.trim().toUpperCase();
    if (cleaned.length < 4) throw new DomainError(`Invalid invoice number: ${value}`);
    return new InvoiceNumber(cleaned);
  }
  public getValue(): string {
    return this.value;
  }
  public toString(): string {
    return this.value;
  }
}

/** ReceiptNumber — PAY-1403-0001, unique globally. */
export class ReceiptNumber {
  private readonly value: string;
  private constructor(value: string) {
    this.value = value;
  }
  public static create(value: string): ReceiptNumber {
    const cleaned = value.trim().toUpperCase();
    if (cleaned.length < 4) throw new DomainError(`Invalid receipt number: ${value}`);
    return new ReceiptNumber(cleaned);
  }
  public getValue(): string {
    return this.value;
  }
  public toString(): string {
    return this.value;
  }
}

export { Money };
