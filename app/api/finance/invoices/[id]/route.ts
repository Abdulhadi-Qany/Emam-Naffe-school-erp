import { db } from '@/lib/db'
import { invoices, invoiceItems, students, feeStructures, grades, sections } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, deleted, badRequest, notFound, unprocessable, withV1, audit, num, money, round } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET    /api/finance/invoices/[id]  → invoice + items
 * PUT    /api/finance/invoices/[id]  (due date, discount, notes — not for paid invoices)
 * DELETE /api/finance/invoices/[id]  (void invoice; blocked once payments exist)
 */
export async function GET(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('fees:read', async ({ schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params

    const [row] = await db
      .select({
        invoice: invoices,
        studentName: students.fullName,
        admissionNumber: students.admissionNumber,
        gradeLevel: grades.level,
        sectionName: sections.name,
        feeType: feeStructures.feeType,
      })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(feeStructures, eq(invoices.feeStructureId, feeStructures.id))
      .leftJoin(grades, eq(students.currentGradeId, grades.id))
      .leftJoin(sections, eq(students.currentSectionId, sections.id))
      .where(and(eq(invoices.id, id), eq(invoices.schoolId, schoolId)))
      .limit(1)

    if (!row) return notFound('Invoice not found')

    const items = await db
      .select()
      .from(invoiceItems)
      .where(eq(invoiceItems.invoiceId, id))
      .orderBy(sql`${invoiceItems.createdAt} asc`)

    return ok({
      ...row.invoice,
      studentName: row.studentName,
      admissionNumber: row.admissionNumber,
      gradeNumber: row.gradeLevel !== null ? String(row.gradeLevel) : null,
      sectionName: row.sectionName,
      descKey: row.feeType ?? 'tuition',
      items: items.map((item) => ({
        ...item,
        amountValue: num(item.amount),
        unitPriceValue: num(item.unitPrice),
      })),
    })
  })(request, context)
}

export async function PUT(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('fees:write', async ({ user, schoolId }, req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Invoice not found')

    if (num(existing.paidAmount) > 0) {
      return unprocessable('A paid invoice cannot be edited', 'INVOICE_PAID')
    }

    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const discountValue = body.discount !== undefined ? round(num(body.discount)) : num(existing.discount)
    const taxValue = body.tax !== undefined ? round(num(body.tax)) : num(existing.tax)
    const subtotal = num(existing.subtotal)
    const totalAmount = round(Math.max(0, subtotal - discountValue + taxValue))

    const [updated] = (await db
      .update(invoices)
      .set({
        dueDate: body.dueDate !== undefined ? new Date(body.dueDate as string) : existing.dueDate,
        discount: money(discountValue),
        tax: money(taxValue),
        totalAmount: money(totalAmount),
        balanceAmount: money(round(totalAmount - num(existing.paidAmount))),
        status: num(existing.paidAmount) >= totalAmount && totalAmount > 0 ? 'paid' : existing.status,
        notes: body.notes !== undefined ? (body.notes as string | null) : existing.notes,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, id))
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'finance',
      entityType: 'invoice',
      entityId: id,
    })

    return ok(updated)
  })(request, context)
}

export async function DELETE(request: NextRequest, context: { params: Promise<{ id: string }> }) {
  return withV1('fees:write', async ({ user, schoolId }, _req, ctx: { params: Promise<{ id: string }> }) => {
    const { id } = await ctx.params
    const [existing] = await db
      .select()
      .from(invoices)
      .where(and(eq(invoices.id, id), eq(invoices.schoolId, schoolId)))
      .limit(1)
    if (!existing) return notFound('Invoice not found')

    if (num(existing.paidAmount) > 0) {
      return unprocessable('An invoice with payments cannot be deleted', 'INVOICE_HAS_PAYMENTS')
    }

    await db.delete(invoices).where(eq(invoices.id, id))

    await audit({
      schoolId,
      userId: user.id,
      action: 'deleted',
      module: 'finance',
      entityType: 'invoice',
      entityId: id,
      changes: { invoiceNumber: existing.invoiceNumber },
    })

    return deleted('Invoice deleted successfully')
  })(request, context)
}
