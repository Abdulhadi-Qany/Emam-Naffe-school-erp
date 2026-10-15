import { describe, it } from 'node:test';
import assert from 'node:assert/strict';
import { Staff } from '@/src/modules/staff/domain/StaffEntity';
import { EmployeeCode } from '@/src/modules/staff/domain/StaffValueObjects';
import { StaffStatus, EmploymentType, StaffGender } from '@/src/modules/staff/domain/StaffEnums';
import { Invoice } from '@/src/modules/finance/domain/InvoiceEntity';
import { InvoiceNumber, ReceiptNumber, PaymentMethod, InvoiceStatus } from '@/src/modules/finance/domain/FinanceValueObjects';
import { OverpaymentError } from '@/src/modules/finance/domain/FinanceErrors';
import { normalizePagination } from '@/src/shared/domain/shared-kernel';

describe('Clean Architecture — Staff aggregate', () => {
  it('hires staff with hire event', () => {
    const s = Staff.hire({
      schoolId: 'school-1',
      employeeCode: EmployeeCode.create('EBPS-1403-0001'),
      firstName: 'Ahmad',
      fatherName: 'Khan',
      familyName: 'Ahmadi',
      gender: StaffGender.MALE,
      nationality: 'Afghan',
      employmentType: EmploymentType.FULL_TIME,
      joinDate: new Date('2024-03-21'),
    });
    assert.equal(s.getFullName(), 'Ahmad Ahmadi');
    assert.equal(s.getStatus(), StaffStatus.ACTIVE);
    assert.equal(s.pullDomainEvents().length, 1);
  });

  it('terminates staff with event', () => {
    const s = Staff.hire({
      schoolId: 'school-1',
      employeeCode: EmployeeCode.create('EBPS-1403-0002'),
      firstName: 'Sara',
      fatherName: 'Ali',
      familyName: 'Karimi',
      gender: StaffGender.FEMALE,
      nationality: 'Afghan',
      employmentType: EmploymentType.PART_TIME,
      joinDate: new Date(),
    });
    s.pullDomainEvents();
    s.terminate('resigned');
    assert.equal(s.getStatus(), StaffStatus.TERMINATED);
    assert.equal(s.pullDomainEvents().length, 1);
  });
});

describe('Clean Architecture — Invoice aggregate', () => {
  it('issues invoice with totals', () => {
    const inv = Invoice.issue({
      schoolId: 'school-1',
      invoiceNumber: InvoiceNumber.create('INV-1403-0001'),
      studentId: 'student-1',
      dueDate: new Date('2024-04-10'),
      lines: [{ description: 'Tuition', quantity: 1, unitAmount: 5000 }],
      taxAFN: 0,
      discountAFN: 500,
    });
    assert.equal(inv.getSubtotal().getAmount(), 5000);
    assert.equal(inv.getTotal().getAmount(), 4500);
    assert.equal(inv.getBalance().getAmount(), 4500);
  });

  it('collects partial then full payment', () => {
    const inv = Invoice.issue({
      schoolId: 'school-1',
      invoiceNumber: InvoiceNumber.create('INV-1403-0002'),
      studentId: 'student-1',
      dueDate: new Date(),
      lines: [{ description: 'Tuition', quantity: 1, unitAmount: 4000 }],
    });
    inv.collectPayment(ReceiptNumber.create('PAY-1403-0001'), 1500, PaymentMethod.CASH, 'user-1');
    assert.equal(inv.getStatus(), InvoiceStatus.PARTIAL);
    inv.collectPayment(ReceiptNumber.create('PAY-1403-0002'), 2500, PaymentMethod.CASH, 'user-1');
    assert.equal(inv.getStatus(), InvoiceStatus.PAID);
    assert.equal(inv.getBalance().getAmount(), 0);
  });

  it('rejects overpayment', () => {
    const inv = Invoice.issue({
      schoolId: 'school-1',
      invoiceNumber: InvoiceNumber.create('INV-1403-0003'),
      studentId: 'student-1',
      dueDate: new Date(),
      lines: [{ description: 'Tuition', quantity: 1, unitAmount: 1000 }],
    });
    assert.throws(() => inv.collectPayment(ReceiptNumber.create('PAY-X'), 2000, PaymentMethod.CASH, 'u'), OverpaymentError);
  });
});

describe('Clean Architecture — shared kernel', () => {
  it('normalizes pagination', () => {
    assert.deepEqual(normalizePagination({ page: 0, limit: 500 }), {
      page: 1, limit: 100, sortBy: 'createdAt', sortOrder: 'desc',
    });
  });
});
