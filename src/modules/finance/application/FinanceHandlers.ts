import type { IInvoiceRepository } from '../domain/IInvoiceRepository';
import type { IssueInvoiceCommand, IssueInvoiceResponse, RecordPaymentCommand, RecordPaymentResponse } from './FinanceCommands';
import type { IClock } from '@/src/application/ports/input/IClock';
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher';
import type { ILogger } from '@/src/application/ports/input/ILogger';
import type { ISequenceGenerator } from '@/src/shared/domain/shared-kernel';
import { ValidationError } from '@/src/application/exceptions';
import { Invoice } from '../domain/InvoiceEntity';
import { InvoiceId, InvoiceNumber, ReceiptNumber, PaymentMethod } from '../domain/FinanceValueObjects';
import { InvoiceNotFoundError, DuplicateInvoiceNumberError } from '../domain/FinanceErrors';
import { afghanYear } from '@/src/modules/staff/application/HireStaffHandler';

export class IssueInvoiceHandler {
  constructor(
    private readonly invoices: IInvoiceRepository,
    private readonly sequences: ISequenceGenerator,
    private readonly clock: IClock,
    private readonly eventPublisher: IEventPublisher,
    private readonly logger: ILogger,
  ) {}

  public async execute(command: IssueInvoiceCommand): Promise<IssueInvoiceResponse> {
    this.validate(command);
    const year = afghanYear(this.clock.now());
    const seq = await this.sequences.next(`invoice-${year}`, command.schoolId);
    const number = InvoiceNumber.create(`INV-${year}-${String(seq).padStart(4, '0')}`);
    if (await this.invoices.existsByNumber(number)) throw new DuplicateInvoiceNumberError(number.getValue());

    const invoice = Invoice.issue({
      schoolId: command.schoolId,
      invoiceNumber: number,
      studentId: command.studentId,
      dueDate: new Date(command.dueDate),
      lines: command.lines,
      discountAFN: command.discountAFN,
      taxAFN: command.taxAFN,
      notes: command.notes,
      generatedBy: command.createdBy,
      issueDate: this.clock.now(),
    });
    await this.invoices.save(invoice);
    await this.eventPublisher.publishAll(invoice.pullDomainEvents());
    this.logger.info('Invoice issued', { number: number.getValue() });
    return {
      invoiceId: invoice.getId().getValue(),
      invoiceNumber: number.getValue(),
      totalAmount: invoice.getTotal().getAmount(),
      balanceAmount: invoice.getBalance().getAmount(),
      status: invoice.getStatus(),
    };
  }

  private validate(c: IssueInvoiceCommand): void {
    const errors: Record<string, string> = {};
    if (!c.schoolId) errors.schoolId = 'School is required';
    if (!c.studentId) errors.studentId = 'studentId is required';
    if (!c.dueDate || Number.isNaN(new Date(c.dueDate).getTime())) errors.dueDate = 'dueDate must be valid';
    if (!c.lines || c.lines.length === 0) errors.lines = 'At least one line is required';
    if (Object.keys(errors).length > 0) throw new ValidationError('Validation failed', errors);
  }
}

export class RecordPaymentHandler {
  constructor(
    private readonly invoices: IInvoiceRepository,
    private readonly sequences: ISequenceGenerator,
    private readonly clock: IClock,
    private readonly eventPublisher: IEventPublisher,
    private readonly logger: ILogger,
  ) {}

  public async execute(command: RecordPaymentCommand): Promise<RecordPaymentResponse> {
    if (!command.invoiceId) throw new ValidationError('invoiceId is required', { invoiceId: 'required' });
    if (!(command.amount > 0)) throw new ValidationError('amount must be positive', { amount: 'positive' });
    const invoice = await this.invoices.findById(InvoiceId.fromString(command.invoiceId));
    if (!invoice) throw new InvoiceNotFoundError(command.invoiceId);

    const year = afghanYear(this.clock.now());
    const seq = await this.sequences.next(`receipt-${year}`, command.schoolId);
    const receipt = ReceiptNumber.create(`PAY-${year}-${String(seq).padStart(4, '0')}`);
    const payment = invoice.collectPayment(receipt, command.amount, command.method as PaymentMethod, command.receivedBy, command.notes);
    await this.invoices.update(invoice);
    await this.eventPublisher.publishAll(invoice.pullDomainEvents());
    this.logger.info('Payment recorded', { receipt: receipt.getValue() });
    return {
      invoiceId: invoice.getId().getValue(),
      receiptNumber: payment.receiptNumber.getValue(),
      paidAmount: invoice.getPaidAmount().getAmount(),
      balanceAmount: invoice.getBalance().getAmount(),
      status: invoice.getStatus(),
    };
  }
}
