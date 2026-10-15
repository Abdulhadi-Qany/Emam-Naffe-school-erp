import { db } from '@/lib/db'
import { payments, students, invoices, userProfiles } from '@/lib/db/schema'
import { and, desc, eq, or, ilike, sql, count } from 'drizzle-orm'
import {
  created,
  parsePagination,
  parseFilters,
  paginationMeta,
  badRequest,
  notFound,
  unprocessable,
  ok,
  withV1,
  audit,
  num,
  money,
  round,
  receiptNumber,
} from '@/lib/api'
import { isoDate } from '@/lib/api/time'
import type { NextRequest } from 'next/server'

const PAYMENT_METHODS = ['cash', 'bank_transfer', 'cheque', 'card', 'mobile_payment'] as const
const PAYMENT_STATUSES = ['pending', 'completed', 'failed', 'refunded'] as const

/**
 * Payments (fee collection desk).
 * GET  /api/finance/payments?studentId&paymentMethod&status&query
 * POST /api/finance/payments { studentId, amount, paymentMethod, invoiceId?, transactionId?, notes? }
 *      → inserts the payment, closes/adjusts the linked invoice and updates balances
 */
export async function GET(request: NextRequest) {
  return withV1('payments:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['studentId', 'paymentMethod', 'paymentStatus'])
    const query = searchParams.get('query')

    const conditions = [eq(payments.schoolId, schoolId)]
    if (filters.studentId) conditions.push(eq(payments.studentId, filters.studentId))
    if (filters.paymentMethod) conditions.push(eq(payments.paymentMethod, filters.paymentMethod as never))
    if (filters.paymentStatus) conditions.push(eq(payments.paymentStatus, filters.paymentStatus as never))
    if (query) {
      const q = `%${query}%`
      conditions.push(
        or(
          ilike(payments.receiptNumber, q),
          ilike(payments.transactionId, q),
          ilike(payments.referenceNumber, q),
          ilike(students.fullName, q),
          ilike(students.admissionNumber, q)
        )!
      )
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(payments)
      .leftJoin(students, and(eq(payments.studentId, students.id), eq(students.schoolId, schoolId)))
      .where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        payment: payments,
        studentName: students.fullName,
        admissionNumber: students.admissionNumber,
        invoiceNumber: invoices.invoiceNumber,
        recordedByName: userProfiles.fullName,
      })
      .from(payments)
      .leftJoin(students, and(eq(payments.studentId, students.id), eq(students.schoolId, schoolId)))
      .leftJoin(invoices, and(
        eq(payments.invoiceId, invoices.id),
        eq(invoices.schoolId, schoolId),
        eq(invoices.studentId, payments.studentId)
      ))
      .leftJoin(userProfiles, eq(payments.receivedBy, userProfiles.userId))
      .where(and(...conditions))
      .orderBy(desc(payments.paymentDate))
      .limit(pagination.limit)
      .offset(pagination.offset)

    const now = new Date()
    const todayStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()))
    const tomorrowStart = new Date(todayStart.getTime() + 24 * 60 * 60 * 1000)
    const monthStart = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), 1))
    const [summaryRow] = await db
      .select({
        todayTotal: sql<string>`coalesce(sum(case when ${payments.paymentDate} >= ${todayStart} and ${payments.paymentDate} < ${tomorrowStart} and ${payments.paymentStatus} = 'completed' then ${payments.amount} else 0 end), 0)`,
        todayCount: sql<number>`count(*) filter (where ${payments.paymentDate} >= ${todayStart} and ${payments.paymentDate} < ${tomorrowStart})::int`,
        monthTotal: sql<string>`coalesce(sum(case when ${payments.paymentDate} >= ${monthStart} and ${payments.paymentStatus} = 'completed' then ${payments.amount} else 0 end), 0)`,
        monthCompletedCount: sql<number>`count(*) filter (where ${payments.paymentDate} >= ${monthStart} and ${payments.paymentStatus} = 'completed')::int`,
        pendingCount: sql<number>`count(*) filter (where ${payments.paymentStatus} = 'pending')::int`,
      })
      .from(payments)
      .where(eq(payments.schoolId, schoolId))

    return ok({
      data: rows.map(({ payment, studentName, admissionNumber, invoiceNumber, recordedByName }) => ({
        ...payment,
        amountValue: num(payment.amount),
        dateLabel: isoDate(payment.paymentDate),
        studentName,
        admissionNumber,
        invoiceNumber,
        recordedByName,
      })),
      pagination: paginationMeta(pagination, total),
      summary: {
        todayTotal: num(summaryRow?.todayTotal),
        todayCount: Number(summaryRow?.todayCount ?? 0),
        monthTotal: num(summaryRow?.monthTotal),
        monthCompletedCount: Number(summaryRow?.monthCompletedCount ?? 0),
        pendingCount: Number(summaryRow?.pendingCount ?? 0),
      },
    })
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('payments:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    for (const field of ['studentId', 'amount', 'paymentMethod']) {
      if (body[field] === undefined || body[field] === null || body[field] === '') {
        return badRequest(`${field} is required`)
      }
    }
    if (!PAYMENT_METHODS.includes(body.paymentMethod as (typeof PAYMENT_METHODS)[number])) {
      return badRequest(`paymentMethod must be one of: ${PAYMENT_METHODS.join(', ')}`)
    }
    if (body.paymentStatus !== undefined && !PAYMENT_STATUSES.includes(body.paymentStatus as (typeof PAYMENT_STATUSES)[number])) {
      return badRequest(`paymentStatus must be one of: ${PAYMENT_STATUSES.join(', ')}`)
    }
    if (typeof body.studentId !== 'string') return badRequest('studentId must be a string')
    if (body.invoiceId !== undefined && body.invoiceId !== null && typeof body.invoiceId !== 'string') {
      return badRequest('invoiceId must be a string')
    }
    if (body.paymentDate !== undefined && (
      typeof body.paymentDate !== 'string' ||
      Number.isNaN(new Date(body.paymentDate).getTime())
    )) {
      return badRequest('paymentDate must be a valid date')
    }

    if (body.transactionId !== undefined && body.transactionId !== null && typeof body.transactionId !== 'string') {
      return badRequest('transactionId must be a string')
    }
    if (body.referenceNumber !== undefined && body.referenceNumber !== null && typeof body.referenceNumber !== 'string') {
      return badRequest('referenceNumber must be a string')
    }
    if (typeof body.amount !== 'number' && typeof body.amount !== 'string') {
      return badRequest('amount must be a number')
    }

    const amountValue = num(body.amount)
    if (!Number.isFinite(amountValue) || amountValue <= 0) {
      return unprocessable('amount must be a finite number greater than zero', 'INVALID_AMOUNT')
    }

    const [student] = await db
      .select({ id: students.id })
      .from(students)
      .where(and(eq(students.id, body.studentId), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')

    if (body.invoiceId) {
      const [invoice] = await db
        .select({ id: invoices.id })
        .from(invoices)
        .where(and(
          eq(invoices.id, body.invoiceId as string),
          eq(invoices.schoolId, schoolId),
          eq(invoices.studentId, body.studentId)
        ))
        .limit(1)
      if (!invoice) return notFound('Invoice not found for this student')
    }

    const paymentStatus = (body.paymentStatus as (typeof PAYMENT_STATUSES)[number] | undefined) ?? 'completed'
    const receiptNumberValue = await receiptNumber(schoolId)

    const result = await db.transaction(async (tx) => {
      let invoiceToUpdate: typeof invoices.$inferSelect | undefined
      if (body.invoiceId && paymentStatus === 'completed') {
        const [invoice] = await tx
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, body.invoiceId as string),
            eq(invoices.schoolId, schoolId),
            eq(invoices.studentId, body.studentId as string)
          ))
          .for('update')
          .limit(1)

        if (!invoice) return null

        const nextPaidAmount = round(num(invoice.paidAmount) + amountValue)
        if (nextPaidAmount > num(invoice.totalAmount)) return null
        invoiceToUpdate = invoice
      }

      const [payment] = (await tx
        .insert(payments)
        .values({
          id: crypto.randomUUID(),
          schoolId,
          receiptNumber: receiptNumberValue,
          studentId: body.studentId as string,
          invoiceId: (body.invoiceId as string) ?? null,
          amount: money(amountValue),
          paymentMethod: body.paymentMethod as never,
          paymentStatus,
          transactionId: (body.transactionId as string) ?? null,
          referenceNumber: (body.referenceNumber as string) ?? null,
          bankName: (body.bankName as string) ?? null,
          chequeNumber: (body.chequeNumber as string) ?? null,
          mobileProvider: (body.mobileProvider as string) ?? null,
          paymentDate: body.paymentDate ? new Date(body.paymentDate as string) : new Date(),
          receivedBy: user.id,
          notes: (body.notes as string) ?? null,
        })
        .returning()) as unknown as Record<string, unknown>[]

      // Keep the linked invoice's paid/balance amounts in sync.
      if (invoiceToUpdate) {
        const paidAmount = round(num(invoiceToUpdate.paidAmount) + amountValue)
        const balance = round(num(invoiceToUpdate.totalAmount) - paidAmount)
        await tx
          .update(invoices)
          .set({
            paidAmount: money(paidAmount),
            balanceAmount: money(balance),
            status: balance === 0 ? 'paid' : 'partial',
            updatedAt: new Date(),
          })
          .where(and(
            eq(invoices.id, invoiceToUpdate.id),
            eq(invoices.schoolId, schoolId)
          ))
      }

      return payment
    })

    if (!result) return unprocessable('Payment exceeds the invoice balance or the invoice is no longer available', 'INVOICE_BALANCE_EXCEEDED')

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'finance',
      entityType: 'payment',
      entityId: result.id as string,
      changes: { receiptNumber: receiptNumberValue, amount: amountValue, studentId: body.studentId, invoiceId: body.invoiceId ?? null },
    })

    return created(result)
  })(request)
}
