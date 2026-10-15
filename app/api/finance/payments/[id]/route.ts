import { db } from '@/lib/db'
import { payments, invoices } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, badRequest, notFound, unprocessable, withV1, audit, num, money, round } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET    /api/finance/payments/[id]
 * PUT    /api/finance/payments/[id]   (fix method/notes while pending or failed)
 * DELETE /api/finance/payments/[id]   (refunds the payment and reopens the invoice balance)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('payments:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [row] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.schoolId, schoolId)))
      .limit(1)
    if (!row) return notFound('Payment not found')
    return ok({ ...row, amountValue: num(row.amount) })
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('payments:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Payment not found')

    if (existing.paymentStatus === 'completed') {
      return badRequest('A completed payment cannot be edited; refund it instead', 'PAYMENT_COMPLETED')
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')
    const methods = ['cash', 'bank_transfer', 'cheque', 'card', 'mobile_payment']
    const statuses = ['pending', 'completed', 'failed']
    if (body.paymentMethod !== undefined && !methods.includes(body.paymentMethod as string)) {
      return badRequest(`paymentMethod must be one of: ${methods.join(', ')}`)
    }
    if (body.paymentStatus !== undefined && !statuses.includes(body.paymentStatus as string)) {
      return badRequest(`paymentStatus must be one of: ${statuses.join(', ')}; use DELETE to refund`)
    }
    for (const field of ['transactionId', 'referenceNumber', 'bankName', 'chequeNumber', 'mobileProvider', 'notes']) {
      if (body[field] !== undefined && body[field] !== null && typeof body[field] !== 'string') {
        return badRequest(`${field} must be a string`)
      }
    }

    const nextStatus = (body.paymentStatus as 'pending' | 'completed' | 'failed' | undefined) ?? existing.paymentStatus
    const updated = await db.transaction(async (tx) => {
      let invoiceToUpdate: typeof invoices.$inferSelect | undefined
      if (nextStatus === 'completed' && existing.invoiceId) {
        const [invoice] = await tx
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, existing.invoiceId),
            eq(invoices.schoolId, schoolId),
            eq(invoices.studentId, existing.studentId)
          ))
          .for('update')
          .limit(1)
        if (!invoice) return null
        if (round(num(invoice.paidAmount) + num(existing.amount)) > num(invoice.totalAmount)) return null
        invoiceToUpdate = invoice
      }

      const [updatedPayment] = (await tx
        .update(payments)
        .set({
          paymentMethod: body.paymentMethod !== undefined ? (body.paymentMethod as never) : existing.paymentMethod,
          paymentStatus: nextStatus,
          transactionId: body.transactionId !== undefined ? (body.transactionId as string | null) : existing.transactionId,
          referenceNumber: body.referenceNumber !== undefined ? (body.referenceNumber as string | null) : existing.referenceNumber,
          bankName: body.bankName !== undefined ? (body.bankName as string | null) : existing.bankName,
          chequeNumber: body.chequeNumber !== undefined ? (body.chequeNumber as string | null) : existing.chequeNumber,
          mobileProvider: body.mobileProvider !== undefined ? (body.mobileProvider as string | null) : existing.mobileProvider,
          notes: body.notes !== undefined ? (body.notes as string | null) : existing.notes,
          updatedAt: new Date(),
        })
        .where(and(eq(payments.id, id), eq(payments.schoolId, schoolId)))
        .returning()) as unknown as Record<string, unknown>[]

      if (invoiceToUpdate) {
        const paidAmount = round(num(invoiceToUpdate.paidAmount) + num(existing.amount))
        const balance = round(num(invoiceToUpdate.totalAmount) - paidAmount)
        await tx.update(invoices)
          .set({
            paidAmount: money(paidAmount),
            balanceAmount: money(balance),
            status: balance === 0 ? 'paid' : 'partial',
            updatedAt: new Date(),
          })
          .where(and(eq(invoices.id, invoiceToUpdate.id), eq(invoices.schoolId, schoolId)))
      }
      return updatedPayment
    })
    if (!updated) return unprocessable('Payment exceeds the invoice balance or the invoice is no longer available', 'INVOICE_BALANCE_EXCEEDED')

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'finance',
      entityType: 'payment',
      entityId: id,
    })

    return ok({ ...updated, amountValue: num(updated.amount as string) })
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('payments:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(payments)
      .where(and(eq(payments.id, id), eq(payments.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Payment not found')

    if (existing.paymentStatus === 'refunded') {
      return badRequest('This payment is already refunded', 'ALREADY_REFUNDED')
    }

    await db.transaction(async (tx) => {
      await tx.update(payments)
        .set({ paymentStatus: 'refunded', updatedAt: new Date() })
        .where(and(eq(payments.id, id), eq(payments.schoolId, schoolId)))

      if (existing.invoiceId && existing.paymentStatus === 'completed') {
        const [invoice] = await tx
          .select()
          .from(invoices)
          .where(and(
            eq(invoices.id, existing.invoiceId),
            eq(invoices.schoolId, schoolId),
            eq(invoices.studentId, existing.studentId)
          ))
          .limit(1)
        if (invoice) {
          const paidAmount = round(Math.max(0, num(invoice.paidAmount) - num(existing.amount)))
          const totalAmount = num(invoice.totalAmount)
          const balance = round(totalAmount - paidAmount)
          await tx
            .update(invoices)
            .set({
              paidAmount: money(paidAmount),
              balanceAmount: money(balance),
              status: paidAmount <= 0 ? 'pending' : 'partial',
              updatedAt: new Date(),
            })
            .where(and(eq(invoices.id, invoice.id), eq(invoices.schoolId, schoolId)))
        }
      }
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'finance',
      entityType: 'payment',
      entityId: id,
      changes: { receiptNumber: existing.receiptNumber, refunded: num(existing.amount) },
    })

    return ok({ message: 'Payment refunded successfully', paymentId: id, refundedAmount: num(existing.amount) })
  })(request, context)
}
