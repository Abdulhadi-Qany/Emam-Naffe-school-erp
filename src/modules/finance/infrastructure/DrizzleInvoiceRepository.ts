import { db } from '@/lib/db';
import { invoices, payments } from '@/lib/db/schema';
import { eq, and, count, sql } from 'drizzle-orm';
import type { IInvoiceRepository, InvoiceSearchFilters } from '../domain/IInvoiceRepository';
import type { PaginationOptions, PaginatedResult } from '@/src/shared/domain/shared-kernel';
import { normalizePagination } from '@/src/shared/domain/shared-kernel';
import type { Invoice } from '../domain/InvoiceEntity';
import { InvoiceId, type InvoiceNumber, type ReceiptNumber } from '../domain/FinanceValueObjects';
import { InvoicePersistenceMapper } from './InvoicePersistenceMapper';

/** Drizzle/Postgres implementation of IInvoiceRepository. */
export class DrizzleInvoiceRepository implements IInvoiceRepository {
  public async save(invoice: Invoice): Promise<void> {
    await db.insert(invoices).values(InvoicePersistenceMapper.toInvoiceRow(invoice) as never);
    for (const pay of invoice.getPayments()) {
      await db.insert(payments).values({
        id: pay.id, schoolId: invoice.getSchoolId(), studentId: invoice.getStudentId(),
        invoiceId: invoice.getId().getValue(), amount: pay.amount.getAmount().toFixed(2),
        paymentMethod: pay.method as never, receiptNumber: pay.receiptNumber.getValue(),
        status: 'completed' as never, notes: pay.notes ?? null,
      } as never);
    }
  }

  public async update(invoice: Invoice): Promise<void> {
    const row = InvoicePersistenceMapper.toInvoiceRow(invoice);
    await db.update(invoices).set({ ...row, updatedAt: new Date() } as never)
      .where(eq(invoices.id, invoice.getId().getValue()));
    const pays = invoice.getPayments();
    if (pays.length > 0) {
      const last = pays[pays.length - 1];
      const [existing] = await db.select({ id: payments.id }).from(payments).where(eq(payments.id, last.id)).limit(1);
      if (!existing) {
        await db.insert(payments).values({
          id: last.id, schoolId: invoice.getSchoolId(), studentId: invoice.getStudentId(),
          invoiceId: invoice.getId().getValue(), amount: last.amount.getAmount().toFixed(2),
          paymentMethod: last.method as never, receiptNumber: last.receiptNumber.getValue(),
          status: 'completed' as never, notes: last.notes ?? null,
        } as never);
      }
    }
  }

  public async findById(id: InvoiceId): Promise<Invoice | null> {
    const [row] = await db.select().from(invoices).where(eq(invoices.id, id.getValue())).limit(1);
    if (!row) return null;
    const pays = await db.select().from(payments).where(eq(payments.invoiceId, id.getValue()));
    return InvoicePersistenceMapper.toDomain(row as Record<string, unknown>, pays as Record<string, unknown>[]);
  }

  public async findByNumber(number: InvoiceNumber): Promise<Invoice | null> {
    const [row] = await db.select().from(invoices).where(eq(invoices.invoiceNumber, number.getValue())).limit(1);
    if (!row) return null;
    return this.findById(InvoiceId.fromString(String((row as Record<string, unknown>).id)));
  }

  public async existsByNumber(number: InvoiceNumber): Promise<boolean> {
    return (await this.findByNumber(number)) !== null;
  }

  public async receiptExists(number: ReceiptNumber): Promise<boolean> {
    const [row] = await db.select({ id: payments.id }).from(payments).where(eq(payments.receiptNumber, number.getValue())).limit(1);
    return !!row;
  }

  public async findAll(filters?: InvoiceSearchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Invoice>> {
    const p = normalizePagination(pagination);
    const conditions = [];
    if (filters?.schoolId) conditions.push(eq(invoices.schoolId, filters.schoolId));
    if (filters?.studentId) conditions.push(eq(invoices.studentId, filters.studentId));
    if (filters?.status) conditions.push(eq(invoices.status, filters.status as never));
    if (filters?.overdueOnly) conditions.push(sql`${invoices.dueDate} < NOW() AND ${invoices.balanceAmount} > 0`);
    const where = conditions.length > 0 ? and(...conditions) : undefined;
    const [totalRow] = await db.select({ count: count() }).from(invoices).where(where as never);
    const total = totalRow?.count ?? 0;
    const rows = await db.select().from(invoices).where(where as never)
      .orderBy(sql`${invoices.createdAt} desc`).limit(p.limit).offset((p.page - 1) * p.limit);
    const data: Invoice[] = [];
    for (const r of rows) {
      const pays = await db.select().from(payments).where(eq(payments.invoiceId, String((r as Record<string, unknown>).id)));
      data.push(InvoicePersistenceMapper.toDomain(r as Record<string, unknown>, pays as Record<string, unknown>[]));
    }
    return { data, total, page: p.page, limit: p.limit, totalPages: Math.max(1, Math.ceil(total / p.limit)) };
  }

  public async findByStudent(schoolId: string, studentId: string): Promise<Invoice[]> {
    const result = await this.findAll({ schoolId, studentId }, { page: 1, limit: 100 });
    return result.data;
  }
}
