import { AggregateRoot } from '@/src/shared/domain/base';
import { DomainError } from '@/src/domain/errors/DomainError';
import { Money } from '@/src/domain/value-objects/Money';
import { InvoiceId, InvoiceNumber, ReceiptNumber, InvoiceStatus, PaymentMethod } from './FinanceValueObjects';
import { OverpaymentError, InvoiceAlreadyPaidError } from './FinanceErrors';
import { InvoiceIssuedEvent, PaymentRecordedEvent, InvoiceWaivedEvent } from './FinanceEvents';

export interface InvoiceLineProps {
  feeStructureId?: string;
  description: string;
  quantity: number;
  unitAmount: number;
}

export interface PaymentProps {
  id: string;
  receiptNumber: ReceiptNumber;
  amount: Money;
  method: PaymentMethod;
  paidAt: Date;
  receivedBy: string;
  notes?: string;
}

export interface InvoiceProps {
  id: InvoiceId;
  schoolId: string;
  invoiceNumber: InvoiceNumber;
  studentId: string;
  issueDate: Date;
  dueDate: Date;
  lines: InvoiceLineProps[];
  discount: Money;
  tax: Money;
  paidAmount: Money;
  status: InvoiceStatus;
  notes?: string;
  generatedBy?: string;
  payments: PaymentProps[];
  createdAt: Date;
  updatedAt: Date;
}

export interface IssueInvoiceProps {
  id?: InvoiceId;
  schoolId: string;
  invoiceNumber: InvoiceNumber;
  studentId: string;
  dueDate: Date;
  lines: InvoiceLineProps[];
  discountAFN?: number;
  taxAFN?: number;
  notes?: string;
  generatedBy?: string;
  issueDate?: Date;
}

/** Invoice aggregate root — subtotal/tax/balance + collect/waive invariants. */
export class Invoice extends AggregateRoot<InvoiceProps> {
  private constructor(props: InvoiceProps) {
    super(props);
  }

  public static issue(props: IssueInvoiceProps): Invoice {
    if (!props.lines || props.lines.length === 0) throw new DomainError('Invoice must have at least one line');
    for (const line of props.lines) {
      if (line.quantity <= 0) throw new DomainError(`Quantity must be positive: ${line.description}`);
      if (line.unitAmount < 0) throw new DomainError(`Unit amount cannot be negative: ${line.description}`);
    }
    if (!props.studentId?.trim()) throw new DomainError('studentId is required');
    const id = props.id ?? InvoiceId.generate();
    const now = new Date();
    const invoice = new Invoice({
      id, schoolId: props.schoolId, invoiceNumber: props.invoiceNumber,
      studentId: props.studentId, issueDate: props.issueDate ?? now, dueDate: props.dueDate,
      lines: props.lines.map((l) => ({ ...l })),
      discount: Money.fromAFN(props.discountAFN ?? 0), tax: Money.fromAFN(props.taxAFN ?? 0),
      paidAmount: Money.zero(), status: InvoiceStatus.PENDING,
      notes: props.notes, generatedBy: props.generatedBy, payments: [],
      createdAt: now, updatedAt: now,
    });
    invoice.addEvent(new InvoiceIssuedEvent(id.getValue(), props.schoolId, props.invoiceNumber.getValue(), invoice.getTotal().getAmount()));
    return invoice;
  }

  public static reconstitute(props: InvoiceProps): Invoice {
    return new Invoice(props);
  }

  public getSubtotal(): Money {
    return this.props.lines.reduce((sum, l) => sum.add(Money.fromAFN(l.quantity * l.unitAmount)), Money.zero());
  }

  public getTotal(): Money {
    return this.getSubtotal().add(this.props.tax).subtract(this.props.discount);
  }

  public getBalance(): Money {
    const total = this.getTotal().getAmount();
    const paid = this.props.paidAmount.getAmount();
    return Money.fromAFN(Math.max(0, total - paid));
  }

  public collectPayment(receipt: ReceiptNumber, amountAFN: number, method: PaymentMethod, receivedBy: string, notes?: string): PaymentProps {
    if (this.props.status === InvoiceStatus.PAID) throw new InvoiceAlreadyPaidError(this.props.id.getValue());
    if (this.props.status === InvoiceStatus.WAIVED) throw new DomainError('Cannot collect on a waived invoice');
    if (amountAFN <= 0) throw new DomainError('Payment amount must be positive');
    const balance = this.getBalance().getAmount();
    if (amountAFN > balance) throw new OverpaymentError(balance, amountAFN);
    const payment: PaymentProps = {
      id: crypto.randomUUID(), receiptNumber: receipt, amount: Money.fromAFN(amountAFN),
      method, paidAt: new Date(), receivedBy, notes,
    };
    (this.props.payments as PaymentProps[]).push(payment);
    (this.props as { paidAmount: Money }).paidAmount = this.props.paidAmount.add(payment.amount);
    const left = this.getBalance().getAmount();
    (this.props as { status: InvoiceStatus }).status = left === 0 ? InvoiceStatus.PAID : InvoiceStatus.PARTIAL;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
    this.addEvent(new PaymentRecordedEvent(this.props.id.getValue(), this.props.schoolId, receipt.getValue(), amountAFN));
    return payment;
  }

  public waive(reason?: string): void {
    if (this.props.status === InvoiceStatus.PAID) throw new DomainError('Cannot waive a paid invoice');
    (this.props as { status: InvoiceStatus }).status = InvoiceStatus.WAIVED;
    (this.props as { updatedAt: Date }).updatedAt = new Date();
    this.addEvent(new InvoiceWaivedEvent(this.props.id.getValue(), this.props.schoolId, reason));
  }

  public getId(): InvoiceId { return this.props.id; }
  public getSchoolId(): string { return this.props.schoolId; }
  public getInvoiceNumber(): InvoiceNumber { return this.props.invoiceNumber; }
  public getStudentId(): string { return this.props.studentId; }
  public getDueDate(): Date { return this.props.dueDate; }
  public getStatus(): InvoiceStatus { return this.props.status; }
  public getPaidAmount(): Money { return this.props.paidAmount; }
  public getPayments(): PaymentProps[] { return [...this.props.payments]; }
}
