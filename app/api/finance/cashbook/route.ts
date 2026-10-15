import { db } from '@/lib/db'
import { payments, expenses } from '@/lib/db/schema'
import { and, desc, eq, sql } from 'drizzle-orm'
import { ok, withV1, num, round, isoDate, startOfDay, endOfDay, parseDateRange } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/finance/cashbook?from&to
 * → daily receipts and payments with a running balance.
 */
export async function GET(request: NextRequest) {
  return withV1('payments:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const { from, to } = parseDateRange(searchParams, 30)

    const inflow = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${payments.paymentDate}), 'YYYY-MM-DD')`,
        amount: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(
        and(
          eq(payments.schoolId, schoolId),
          eq(payments.paymentStatus, 'completed'),
          sql`${payments.paymentDate} >= ${from}`,
          sql`${payments.paymentDate} <= ${to}`
        )
      )
      .groupBy(sql`1`)

    const outflow = await db
      .select({
        day: sql<string>`to_char(date_trunc('day', ${expenses.expenseDate}), 'YYYY-MM-DD')`,
        amount: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(
        and(
          eq(expenses.schoolId, schoolId),
          eq(expenses.status, 'approved'),
          sql`${expenses.expenseDate} >= ${from}`,
          sql`${expenses.expenseDate} <= ${to}`
        )
      )
      .groupBy(sql`1`)

    const byDay = new Map<string, { inflow: number; outflow: number }>()
    for (const row of inflow) {
      const entry = byDay.get(row.day) ?? { inflow: 0, outflow: 0 }
      entry.inflow = round(num(row.amount))
      byDay.set(row.day, entry)
    }
    for (const row of outflow) {
      const entry = byDay.get(row.day) ?? { inflow: 0, outflow: 0 }
      entry.outflow = round(num(row.amount))
      byDay.set(row.day, entry)
    }

    let balance = 0
    const days = Array.from(byDay.entries())
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([day, values]) => {
        balance = round(balance + values.inflow - values.outflow)
        return {
          day,
          inflow: values.inflow,
          outflow: values.outflow,
          net: round(values.inflow - values.outflow),
          balance,
        }
      })

    const totals = days.reduce(
      (acc, day) => ({
        inflow: round(acc.inflow + day.inflow),
        outflow: round(acc.outflow + day.outflow),
      }),
      { inflow: 0, outflow: 0 }
    )

    return ok({
      range: { from: isoDate(from), to: isoDate(to) },
      totals: { ...totals, net: round(totals.inflow - totals.outflow) },
      days,
    })
  })(request)
}
