import { DomainError } from '@/src/domain/errors/DomainError';

export class InvoiceNotFoundError extends DomainError {
  constructor(invoiceId: string) {
    super(`Invoice not found: ${invoiceId}`, 'INVOICE_NOT_FOUND', { invoiceId });
    this.name = 'InvoiceNotFoundError';
  }
}

export class InvoiceAlreadyPaidError extends DomainError {
  constructor(invoiceId: string) {
    super(`Invoice is already fully paid: ${invoiceId}`, 'INVOICE_ALREADY_PAID', { invoiceId });
    this.name = 'InvoiceAlreadyPaidError';
  }
}

export class OverpaymentError extends DomainError {
  constructor(balance: number, attempted: number) {
    super(`Payment ${attempted} exceeds balance ${balance}`, 'OVERPAYMENT', { balance, attempted });
    this.name = 'OverpaymentError';
  }
}

export class DuplicateInvoiceNumberError extends DomainError {
  constructor(number: string) {
    super(`Invoice number already exists: ${number}`, 'DUPLICATE_INVOICE_NUMBER', { number });
    this.name = 'DuplicateInvoiceNumberError';
  }
}
