import { db } from '@/lib/db'
import { invoices, students, grades, sections } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, withV1, num, round, parseFilters } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/finance/collections?bucket&classId
 * → overdue balances grouped by aging bucket with the reminder queue.
 */
export async function GET(request: NextRequest) {
  return withV1('fees:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const filters = parseFilters(searchParams, ['classId', 'gradeId'])
    const bucket = searchParams.get('bucket')

    const conditions = [
      eq(invoices.schoolId, schoolId),
      sql`${invoices.status} in ('pending', 'partial', 'overdue')`,
    ]
    if (filters.classId) conditions.push(eq(students.id, sql`${invoices.studentId}`))
    if (bucket && ['current', '1-30', '31-60', '61-90', '90+'].includes(bucket)) {
      conditions.push(sql`${invoices.dueDate} < now()`)
    }

    const rows = await db
      .select({
        invoice: invoices,
        studentName: students.fullName,
        admissionNumber: students.admissionNumber,
        guardianMobile: students.fatherMobile,
        gradeLevel: grades.level,
        sectionName: sections.name,
      })
      .from(invoices)
      .innerJoin(students, eq(invoices.studentId, students.id))
      .leftJoin(grades, eq(students.currentGradeId, grades.id))
      .leftJoin(sections, eq(students.currentSectionId, sections.id))
      .where(and(...conditions))
      .orderBy(desc(invoices.dueDate))
      .limit(500)

    const now = Date.now()
    const buckets: Record<string, { amount: number; count: number }> = {
      current: { amount: 0, count: 0 },
      '1-30': { amount: 0, count: 0 },
      '31-60': { amount: 0, count: 0 },
      '61-90': { amount: 0, count: 0 },
      '90+': { amount: 0, count: 0 },
    }

    const queue = rows.map((row) => {
      const balance = num(row.invoice.balanceAmount)
      const dueTime = row.invoice.dueDate ? new Date(row.invoice.dueDate).getTime() : now
      const days = Math.floor((now - dueTime) / 86_400_000)
      const key = days <= 0 ? 'current' : days <= 30 ? '1-30' : days <= 60 ? '31-60' : days <= 90 ? '61-90' : '90+'
      buckets[key].amount = round(buckets[key].amount + balance)
      buckets[key].count += 1

      return {
        invoiceId: row.invoice.id,
        invoiceNumber: row.invoice.invoiceNumber,
        studentId: row.invoice.studentId,
        studentName: row.studentName,
        admissionNumber: row.admissionNumber,
        guardianMobile: row.guardianMobile,
        gradeLevel: row.gradeLevel !== null ? String(row.gradeLevel) : null,
        sectionName: row.sectionName,
        balance,
        dueDate: row.invoice.dueDate,
        dueDateLabel: row.invoice.dueDate ? row.invoice.dueDate.toISOString().slice(0, 10) : null,
        overdueDays: Math.max(0, days),
        bucket: key,
      }
    })

    const filtered = bucket ? queue.filter((entry) => entry.bucket === bucket) : queue

    return ok({
      buckets,
      reminders: filtered,
      totals: {
        count: filtered.length,
        amount: round(filtered.reduce((sum, entry) => sum + entry.balance, 0)),
      },
    })
  })(request)
}
