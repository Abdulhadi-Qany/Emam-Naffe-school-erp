import { db } from '@/lib/db'
import { invoices, invoiceItems, students, feeStructures, grades, sections, academicYears, terms } from '@/lib/db/schema'
import { and, desc, eq, or, ilike, sql, count, inArray } from 'drizzle-orm'
import {
  paged,
  created,
  ok,
  badRequest,
  notFound,
  unprocessable,
  withV1,
  audit,
  parsePagination,
  parseFilters,
  num,
  money,
  round,
  invoiceNumber,
} from '@/lib/api'
import type { NextRequest } from 'next/server'

const STATUSES = ['pending', 'partial', 'paid', 'overdue', 'waived'] as const

/**
 * Invoices.
 * GET  /api/finance/invoices?status&studentId&gradeId&query
 *      â†’ joined display rows (student name, class label, fee type) the
 *        localized invoices page renders
 * POST /api/finance/invoices { studentId, feeStructureId?, items: [{ description, unitPrice, quantity?, feeStructureId? }], discount?, tax?, dueDate }
 *      â†’ issues one invoice in a transaction (numbering + items + totals)
 * POST /api/finance/invoices/bulk-generate { gradeId, termLabel, dueDate }
 *      â†’ issues one invoice per student in a grade from the matching structures
 */
export async function GET(request: NextRequest) {
  return withV1('fees:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'studentId', 'feeStructureId'])
    const query = searchParams.get('query')

    const conditions = [eq(invoices.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(invoices.status, filters.status as never))
    if (filters.studentId) conditions.push(eq(invoices.studentId, filters.studentId))
    if (filters.feeStructureId) conditions.push(eq(invoices.feeStructureId, filters.feeStructureId))

    if (query) {
      const q = `%${query}%`
      conditions.push(
        or(
          ilike(invoices.invoiceNumber, q),
          ilike(students.fullName, q),
          ilike(students.admissionNumber, q),
          ilike(students.registrationNumber, q)
        )!
      )
    }

    if (filters.gradeId ?? searchParams.get('gradeId')) {
      const gradeId = searchParams.get('gradeId') as string
      conditions.push(sql`${invoices.studentId} in (select ${students.id} from ${students} where ${students.currentGradeId} = ${gradeId} and ${students.schoolId} = ${schoolId})`)
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(invoices)
      .leftJoin(students, eq(invoices.studentId, students.id))
      .where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        invoice: invoices,
        studentName: students.fullName,
        studentDari: sql<string | null>`null`,
        admissionNumber: students.admissionNumber,
        guardianName: sql<string | null>`(
          select ${students.familyName} from ${students}
          where ${students.id} = ${invoices.studentId} and ${students.schoolId} = ${schoolId}
        )`,
        gradeLevel: grades.level,
        gradeName: grades.name,
        sectionName: sections.name,
        feeType: feeStructures.feeType,
      })
      .from(invoices)
      .leftJoin(students, and(eq(invoices.studentId, students.id), eq(students.schoolId, schoolId)))
      .leftJoin(feeStructures, and(eq(invoices.feeStructureId, feeStructures.id), eq(feeStructures.schoolId, schoolId)))
      .leftJoin(grades, and(eq(students.currentGradeId, grades.id), eq(grades.schoolId, schoolId)))
      .leftJoin(sections, and(eq(students.currentSectionId, sections.id), eq(sections.schoolId, schoolId)))
      .where(and(...conditions))
      .orderBy(desc(invoices.issueDate))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ invoice, studentName, admissionNumber, guardianName, gradeLevel, gradeName, sectionName, feeType }) => ({
        ...invoice,
        totalAmountValue: num(invoice.totalAmount),
        paidAmountValue: num(invoice.paidAmount),
        balanceAmountValue: num(invoice.balanceAmount),
        discountValue: num(invoice.discount),
        issueDateLabel: invoice.issueDate ? invoice.issueDate.toISOString().slice(0, 10) : null,
        dueDateLabel: invoice.dueDate ? invoice.dueDate.toISOString().slice(0, 10) : null,
        paidDateLabel: null,
        studentName,
        admissionNumber,
        guardianName,
        gradeNumber: gradeLevel !== null ? String(gradeLevel) : null,
        gradeName,
        sectionName,
        descKey: feeType ?? 'tuition',
        route: null,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('fees:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const studentId = typeof body.studentId === 'string' ? body.studentId : ''
    const dueDateRaw = typeof body.dueDate === 'string' ? body.dueDate : ''
    const items = body.items as { description: string; unitPrice: number | string; quantity?: number | string; feeStructureId?: string; discount?: number | string }[] | undefined

    if (!studentId || !dueDateRaw) return badRequest('studentId and dueDate are required')
    if (!Array.isArray(items) || items.length === 0) return badRequest('items must be a non-empty array')
    for (const item of items) {
      if (!item || typeof item !== 'object' || typeof item.description !== 'string' || !item.description.trim() || item.unitPrice === undefined || item.unitPrice === null) {
        return badRequest('each item requires description and unitPrice')
      }
      const quantity = item.quantity === undefined ? 1 : Number(item.quantity)
      const unitPrice = Number(item.unitPrice)
      const itemDiscount = Number(item.discount ?? 0)
      if (!Number.isFinite(quantity) || quantity <= 0 || !Number.isFinite(unitPrice) || unitPrice < 0) {
        return badRequest('each item requires a positive quantity and a non-negative unitPrice')
      }
      if (!Number.isFinite(itemDiscount) || itemDiscount < 0 || itemDiscount > quantity * unitPrice) {
        return badRequest('item discount must be non-negative and no greater than the item amount')
      }
    }
    if (body.feeStructureId !== undefined && body.feeStructureId !== null && typeof body.feeStructureId !== 'string') {
      return badRequest('feeStructureId must be a string')
    }

    const dueDate = new Date(dueDateRaw)
    if (Number.isNaN(dueDate.getTime())) return badRequest('dueDate must be a valid date')

    const [student] = await db.select({
      id: students.id,
      currentGradeId: students.currentGradeId,
      currentSectionId: students.currentSectionId,
    }).from(students)
      .where(and(eq(students.id, studentId), eq(students.schoolId, schoolId)))
      .limit(1)
    if (!student) return notFound('Student not found')

    const requestedFeeStructureIds = Array.from(new Set([
      ...(body.feeStructureId ? [body.feeStructureId as string] : []),
      ...items.flatMap((item) => item.feeStructureId ? [item.feeStructureId] : []),
    ]))
    if (items.some((item) => item.feeStructureId !== undefined && typeof item.feeStructureId !== 'string')) {
      return badRequest('item feeStructureId must be a string')
    }
    if (body.discount !== undefined && (typeof body.discount !== 'number' && typeof body.discount !== 'string')) {
      return badRequest('discount must be a number')
    }
    if (body.tax !== undefined && (typeof body.tax !== 'number' && typeof body.tax !== 'string')) {
      return badRequest('tax must be a number')
    }
    if (requestedFeeStructureIds.length > 0) {
      const validStructures = await db.select({
        id: feeStructures.id,
        gradeId: feeStructures.gradeId,
        sectionId: feeStructures.sectionId,
      }).from(feeStructures)
        .where(and(
          eq(feeStructures.schoolId, schoolId),
          inArray(feeStructures.id, requestedFeeStructureIds)
        ))
      if (validStructures.length !== requestedFeeStructureIds.length) {
        return badRequest('feeStructureId must refer to a fee structure in the current school')
      }
      if (validStructures.some((structure) =>
        (structure.gradeId && structure.gradeId !== student.currentGradeId) ||
        (structure.sectionId && structure.sectionId !== student.currentSectionId)
      )) {
        return badRequest("feeStructureId must apply to the student's current grade and section")
      }
    }

    const academicYear = await resolveAcademicYear(schoolId)
    const subtotal = round(items.reduce((sum, item) => {
      const lineAmount = num(item.unitPrice) * num(item.quantity ?? 1) - num(item.discount ?? 0)
      return sum + lineAmount
    }, 0))
    const discountValue = round(num(body.discount ?? 0))
    const taxValue = round(num(body.tax ?? 0))
    if (!Number.isFinite(discountValue) || discountValue < 0 || discountValue > subtotal) {
      return badRequest('discount must be non-negative and no greater than the invoice subtotal')
    }
    if (!Number.isFinite(taxValue) || taxValue < 0) {
      return badRequest('tax must be a non-negative number')
    }
    const totalAmount = round(subtotal - discountValue + taxValue)

    if (totalAmount <= 0) return unprocessable('Invoice total must be greater than zero', 'INVALID_TOTAL')

    const receipt = await db.transaction(async (tx) => {
      const invoiceNumberValue = await invoiceNumber(schoolId, tx as never)

      const [invoice] = (await tx
        .insert(invoices)
        .values({
          id: crypto.randomUUID(),
          schoolId,
          invoiceNumber: invoiceNumberValue,
          studentId,
          feeStructureId: (body.feeStructureId as string) ?? null,
          issueDate: new Date(),
          dueDate,
          subtotal: money(subtotal),
          discount: money(discountValue),
          tax: money(taxValue),
          totalAmount: money(totalAmount),
          paidAmount: money(0),
          balanceAmount: money(totalAmount),
          status: 'pending',
          notes: (body.notes as string) ?? null,
          generatedBy: user.id,
        })
        .returning()) as unknown as Record<string, unknown>[]

      for (const item of items) {
        const quantity = num(item.quantity ?? 1)
        const unitPrice = num(item.unitPrice)
        const itemDiscount = num(item.discount ?? 0)
        await tx.insert(invoiceItems).values({
          id: crypto.randomUUID(),
          invoiceId: invoice.id as string,
          feeStructureId: item.feeStructureId ?? null,
          description: String(item.description),
          quantity: String(quantity),
          unitPrice: money(unitPrice),
          discount: money(itemDiscount),
          tax: money(0),
          amount: money(unitPrice * quantity - itemDiscount),
        } as never)
      }

      return invoice
    })

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'finance',
      entityType: 'invoice',
      entityId: receipt.id as string,
      changes: { invoiceNumber: receipt.invoiceNumber, total: totalAmount, studentId },
    })

    return created(receipt)
  })(request)
}

/** POST /api/finance/invoices/bulk-generate â€” one invoice per student for a grade. */
export async function resolveAcademicYear(schoolId: string): Promise<string | null> {
  const [current] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .innerJoin(terms, eq(terms.academicYearId, academicYears.id))
    .where(and(eq(academicYears.schoolId, schoolId), eq(academicYears.isCurrent, true)))
    .limit(1)
  if (current) return current.id
  const [latest] = await db
    .select({ id: academicYears.id })
    .from(academicYears)
    .where(eq(academicYears.schoolId, schoolId))
    .orderBy(desc(academicYears.startDate))
    .limit(1)
  return latest?.id ?? null
}
