import { Invoice, type InvoiceProps } from '../domain/InvoiceEntity';
import { InvoiceId, InvoiceNumber, ReceiptNumber, InvoiceStatus, PaymentMethod } from '../domain/FinanceValueObjects';
import { Money } from '@/src/domain/value-objects/Money';

type Row = Record<string, unknown>;
const str = (v: unknown): string | undefined => (typeof v === 'string' ? v : undefined);
const num = (v: unknown): number => (typeof v === 'number' ? v : Number(v ?? 0));
const toDate = (v: unknown, fallback = new Date()): Date => {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return fallback;
};

/** Maps Invoice aggregate <-> invoices/payments rows. Infrastructure only. */
export class InvoicePersistenceMapper {
  public static toDomain(row: Row, paymentRows: Row[] = [], lineRows: Row[] = []): Invoice {
    return Invoice.reconstitute({
      id: InvoiceId.fromString(String(row.id)),
      schoolId: String(row.schoolId),
      invoiceNumber: InvoiceNumber.create(String(row.invoiceNumber)),
      studentId: String(row.studentId),
      issueDate: toDate(row.issueDate),
      dueDate: toDate(row.dueDate),
      lines: lineRows.map((l) => ({
        feeStructureId: str(l.feeStructureId),
        description: String(l.description ?? 'Fee'),
        quantity: num(l.quantity) || 1,
        unitAmount: num(l.unitAmount),
      })),
      discount: Money.fromAFN(num(row.discount)),
      tax: Money.fromAFN(num(row.tax)),
      paidAmount: Money.fromAFN(num(row.paidAmount)),
      status: (str(row.status) as InvoiceStatus) ?? InvoiceStatus.PENDING,
      notes: str(row.notes),
      generatedBy: str(row.generatedBy),
      payments: paymentRows.map((p) => ({
        id: String(p.id),
        receiptNumber: ReceiptNumber.create(String(p.receiptNumber ?? p.id)),
        amount: Money.fromAFN(num(p.amount)),
        method: (str(p.method) as PaymentMethod) ?? PaymentMethod.CASH,
        paidAt: toDate(p.paidAt),
        receivedBy: String(p.receivedBy ?? ''),
        notes: str(p.notes),
      })),
      createdAt: toDate(row.createdAt),
      updatedAt: toDate(row.updatedAt),
    });
  }

  public static toInvoiceRow(i: Invoice): Row {
    const p: InvoiceProps = i.toProps();
    return {
      id: p.id.getValue(),
      schoolId: p.schoolId,
      invoiceNumber: p.invoiceNumber.getValue(),
      studentId: p.studentId,
      issueDate: p.issueDate,
      dueDate: p.dueDate,
      subtotal: i.getSubtotal().getAmount().toFixed(2),
      discount: p.discount.getAmount().toFixed(2),
      tax: p.tax.getAmount().toFixed(2),
      totalAmount: i.getTotal().getAmount().toFixed(2),
      paidAmount: p.paidAmount.getAmount().toFixed(2),
      balanceAmount: i.getBalance().getAmount().toFixed(2),
      status: p.status,
      notes: p.notes ?? null,
      generatedBy: p.generatedBy ?? null,
    };
  }
}
