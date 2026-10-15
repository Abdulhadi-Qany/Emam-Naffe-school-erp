import type { Invoice } from './InvoiceEntity';
import type { InvoiceId, InvoiceNumber, ReceiptNumber, InvoiceStatus } from './FinanceValueObjects';
import type { PaginatedResult, PaginationOptions } from '@/src/shared/domain/shared-kernel';

export interface InvoiceSearchFilters {
  schoolId?: string;
  studentId?: string;
  status?: InvoiceStatus;
  overdueOnly?: boolean;
}

/** Port implemented by infrastructure. */
export interface IInvoiceRepository {
  save(invoice: Invoice): Promise<void>;
  update(invoice: Invoice): Promise<void>;
  findById(id: InvoiceId): Promise<Invoice | null>;
  findByNumber(number: InvoiceNumber): Promise<Invoice | null>;
  existsByNumber(number: InvoiceNumber): Promise<boolean>;
  receiptExists(number: ReceiptNumber): Promise<boolean>;
  findAll(filters?: InvoiceSearchFilters, pagination?: PaginationOptions): Promise<PaginatedResult<Invoice>>;
  findByStudent(schoolId: string, studentId: string): Promise<Invoice[]>;
}
