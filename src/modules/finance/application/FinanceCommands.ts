import type { ICommand } from '@/src/shared/application/base-handlers';

export interface InvoiceLineInput {
  feeStructureId?: string;
  description: string;
  quantity: number;
  unitAmount: number;
}

export interface IssueInvoiceCommand extends ICommand {
  schoolId: string;
  studentId: string;
  dueDate: string;
  lines: InvoiceLineInput[];
  discountAFN?: number;
  taxAFN?: number;
  notes?: string;
  createdBy: string;
}

export interface IssueInvoiceResponse {
  invoiceId: string;
  invoiceNumber: string;
  totalAmount: number;
  balanceAmount: number;
  status: string;
}

export interface RecordPaymentCommand extends ICommand {
  schoolId: string;
  invoiceId: string;
  amount: number;
  method: 'cash' | 'bank_transfer' | 'cheque' | 'card' | 'mobile_payment';
  notes?: string;
  receivedBy: string;
}

export interface RecordPaymentResponse {
  invoiceId: string;
  receiptNumber: string;
  paidAmount: number;
  balanceAmount: number;
  status: string;
}
