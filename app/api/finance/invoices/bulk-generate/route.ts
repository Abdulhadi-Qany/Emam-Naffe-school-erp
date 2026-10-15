import { db } from '@/lib/db'
import { invoices, invoiceItems, students, feeStructures, grades } from '@/lib/db/schema'
import { and, eq, isNull, or, sql } from 'drizzle-orm'
import { created, badRequest, unprocessable, withV1, audit, num, money, round, invoiceNumber } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * POST /api/finance/invoices/bulk-generate { gradeId, dueDate, termLabel?, feeStructureId? }
 * → issues one pending invoice per enrolled student of a grade using the active
 *   fee structure (or the structure passed in). Students that already have a
 *   pending invoice are skipped and reported.
 */
export async function POST(request: NextRequest) {
  return withV1('fees:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const gradeId = typeof body.gradeId === 'string' ? body.gradeId : ''
    const dueDateRaw = typeof body.dueDate === 'string' ? body.dueDate : ''
    if (!gradeId || !dueDateRaw) return badRequest('gradeId and dueDate are required')
    if (body.feeStructureId !== undefined && body.feeStructureId !== null && typeof body.feeStructureId !== 'string') {
      return badRequest('feeStructureId must be a string')
    }
    if (body.termLabel !== undefined && body.termLabel !== null && typeof body.termLabel !== 'string') {
      return badRequest('termLabel must be a string')
    }

    const dueDate = new Date(dueDateRaw)
    if (Number.isNaN(dueDate.getTime())) return badRequest('dueDate must be a valid date')

    const [grade] = await db.select({ id: grades.id }).from(grades)
      .where(and(eq(grades.id, gradeId), eq(grades.schoolId, schoolId)))
      .limit(1)
    if (!grade) return badRequest('gradeId must belong to the current school')

    let structure = null as null | typeof feeStructures.$inferSelect
    if (body.feeStructureId) {
      const [found] = await db
        .select()
        .from(feeStructures)
        .where(and(
          eq(feeStructures.id, body.feeStructureId as string),
          eq(feeStructures.schoolId, schoolId),
          eq(feeStructures.isActive, true),
          or(isNull(feeStructures.gradeId), eq(feeStructures.gradeId, gradeId)),
          isNull(feeStructures.sectionId)
        ))
        .limit(1)
      structure = found ?? null
    } else {
      const [found] = await db
        .select()
        .from(feeStructures)
        .where(and(
          eq(feeStructures.schoolId, schoolId),
          eq(feeStructures.isActive, true),
          eq(feeStructures.feeType, 'tuition'),
          or(isNull(feeStructures.gradeId), eq(feeStructures.gradeId, gradeId)),
          isNull(feeStructures.sectionId)
        ))
        .limit(1)
      structure = found ?? null
    }

    if (!structure) return unprocessable('No active fee structure found for tuition', 'NO_FEE_STRUCTURE')

    const amount = num(structure.amount)
    if (amount <= 0) return unprocessable('The selected fee structure has no amount', 'INVALID_AMOUNT')

    const roster = await db
      .select({ id: students.id, admissionNumber: students.admissionNumber })
      .from(students)
      .where(and(eq(students.schoolId, schoolId), eq(students.currentGradeId, gradeId), sql`${students.status} <> 'deleted'`))
      .orderBy(sql`${students.fullName} asc`)
      .limit(501)

    if (roster.length === 0) return unprocessable('No students found in this grade', 'NO_STUDENTS')
    if (roster.length > 500) return unprocessable('This bulk operation supports at most 500 students per request', 'BULK_LIMIT_EXCEEDED')

    const result = await db.transaction(async (tx) => {
      const issued: Record<string, unknown>[] = []
      const skipped: { studentId: string; admissionNumber: string | null; reason: string }[] = []

      for (const student of roster) {
        const [existing] = await tx
          .select({ id: invoices.id })
          .from(invoices)
          .where(and(eq(invoices.studentId, student.id), sql`${invoices.status} in ('pending', 'partial')`))
          .limit(1)
        if (existing) {
          skipped.push({ studentId: student.id, admissionNumber: student.admissionNumber, reason: 'existing_open_invoice' })
          continue
        }

        const invoiceNumberValue = await invoiceNumber(schoolId, tx as never)
        const [invoice] = (await tx
          .insert(invoices)
          .values({
            id: crypto.randomUUID(),
            schoolId,
            invoiceNumber: invoiceNumberValue,
            studentId: student.id,
            feeStructureId: structure.id,
            issueDate: new Date(),
            dueDate,
            subtotal: money(amount),
            discount: money(0),
            tax: money(0),
            totalAmount: money(amount),
            paidAmount: money(0),
            balanceAmount: money(amount),
            status: 'pending',
            notes: (body.termLabel as string) ? `Term fee · ${String(body.termLabel)}` : null,
            generatedBy: user.id,
          })
          .returning()) as unknown as Record<string, unknown>[]

        await tx.insert(invoiceItems).values({
          id: crypto.randomUUID(),
          invoiceId: invoice.id as string,
          feeStructureId: structure.id,
          description: structure.feeType,
          quantity: '1',
          unitPrice: money(amount),
          discount: money(0),
          tax: money(0),
          amount: money(amount),
        } as never)

        issued.push(invoice)
      }

      return { issued, skipped }
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'finance',
      entityType: 'invoice_bulk_generate',
      entityId: gradeId,
      changes: { issued: result.issued.length, skipped: result.skipped.length },
    })

    return created({
      gradeId,
      issuedCount: result.issued.length,
      skippedCount: result.skipped.length,
      totalAmount: round(amount * result.issued.length),
      invoices: result.issued,
      skipped: result.skipped,
    })
  })(request)
}
