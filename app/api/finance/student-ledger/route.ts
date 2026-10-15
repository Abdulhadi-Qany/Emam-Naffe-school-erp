import { db } from '@/lib/db'
import { invoices, payments, discounts, students } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, badRequest, withV1, num, round, isoDate } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/finance/student-ledger?studentId=&limit=
 * → every charge (invoice) and credit (payment) for one student with a running
 *    balance, aging and the scholarship flag used by the student profile page.
 */
export async function GET(request: NextRequest) {
  return withV1('fees:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const studentId = searchParams.get('studentId')
    const limit = Math.min(parseInt(searchParams.get('limit') || '100', 10) || 100, 500)

    if (!studentId) return badRequest('studentId is required')

    const [student] = await db.select({ id: students.id }).from(students).where(eq(students.id, studentId)).limit(1)
    if (!student) return badRequest('studentId does not reference a student')

    const invoiceRows = await db
      .select({
        id: invoices.id,
        invoiceNumber: invoices.invoiceNumber,
        dueDate: invoices.dueDate,
        issueDate: invoices.issueDate,
        totalAmount: invoices.totalAmount,
        paidAmount: invoices.paidAmount,
        balanceAmount: invoices.balanceAmount,
        status: invoices.status,
      })
      .from(invoices)
      .where(and(eq(invoices.schoolId, schoolId), eq(invoices.studentId, studentId)))
      .orderBy(sql`${invoices.issueDate} desc`)

    const paymentRows = await db
      .select({
        id: payments.id,
        receiptNumber: payments.receiptNumber,
        paymentDate: payments.paymentDate,
        amount: payments.amount,
        paymentMethod: payments.paymentMethod,
        paymentStatus: payments.paymentStatus,
        notes: payments.notes,
      })
      .from(payments)
      .where(and(eq(payments.schoolId, schoolId), eq(payments.studentId, studentId)))
      .orderBy(sql`${payments.paymentDate} desc`)
      .limit(limit)

    const discountRows = await db
      .select({
        id: discounts.id,
        name: discounts.name,
        discountType: discounts.discountType,
        discountValue: discounts.discountValue,
        isActive: discounts.isActive,
      })
      .from(discounts)
      .where(and(eq(discounts.schoolId, schoolId), eq(discounts.studentId, studentId)))

    const charges = invoiceRows.map((invoice) => ({
      id: invoice.id,
      type: 'charge' as const,
      reference: invoice.invoiceNumber,
      date: invoice.dueDate,
      dateLabel: invoice.dueDate ? isoDate(invoice.dueDate) : null,
      amount: num(invoice.totalAmount),
      paid: num(invoice.paidAmount),
      balance: num(invoice.balanceAmount),
      status: invoice.status,
      description: `Invoice ${invoice.invoiceNumber}`,
    }))

    const credits = paymentRows.map((payment) => ({
      id: payment.id,
      type: 'payment' as const,
      reference: payment.receiptNumber,
      date: payment.paymentDate,
      dateLabel: isoDate(payment.paymentDate),
      amount: -num(payment.amount),
      paid: 0,
      balance: 0,
      status: payment.paymentStatus,
      description: `Payment ${payment.paymentMethod}${payment.notes ? ` · ${payment.notes}` : ''}`,
    }))

    const entries = [...charges, ...credits]
      .sort((a, b) => new Date(b.date ?? 0).getTime() - new Date(a.date ?? 0).getTime())
      .slice(0, limit)

    let runningBalance = round(charges.reduce((sum, charge) => sum + charge.balance, 0))

    const totals = {
      billed: round(charges.reduce((sum, charge) => sum + charge.amount, 0)),
      paid: round(credits.reduce((sum, credit) => sum + Math.abs(credit.amount), 0)),
      balance: runningBalance,
      aging: agingBuckets(charges),
    }
    runningBalance = totals.balance

    return ok({
      studentId,
      entries: entries.map((entry) => ({ ...entry, runningBalance: (runningBalance = round(runningBalance + (entry.type === 'charge' ? entry.amount : entry.amount))) })),
      totals,
      scholarships: discountRows.map((discount) => ({
        id: discount.id,
        name: discount.name,
        discountType: discount.discountType,
        discountValue: num(discount.discountValue),
        isActive: discount.isActive,
      })),
    })
  })(request)
}

function agingBuckets(charges: { total?: number; balance: number; date: Date | null; status: string }[]) {
  const now = Date.now()
  const buckets = { current: 0, '1-30': 0, '31-60': 0, '61-90': 0, '90+': 0 }
  for (const charge of charges) {
    if (charge.balance <= 0) continue
    const due = charge.date ? new Date(charge.date).getTime() : now
    const days = Math.floor((now - due) / 86_400_000)
    const key = days <= 0 ? 'current' : days <= 30 ? '1-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : '90+'
    buckets[key] = round(buckets[key] + charge.balance)
  }
  return buckets
}
