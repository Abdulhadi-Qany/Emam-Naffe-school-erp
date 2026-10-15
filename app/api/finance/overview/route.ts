import { db } from '@/lib/db'
import { payments, invoices, expenses, budgets, discounts, students } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, withV1, num, round, isoDate, startOfDay, endOfDay } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/finance/overview?from&to
 * → the finance dashboard tiles: collected/expected/outstanding, aging,
 *   scholarships/discounts, expenses, budgets and cash-flow series.
 */
export async function GET(request: NextRequest) {
  return withV1('fees:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const from = searchParams.get('from') ? new Date(searchParams.get('from') as string) : null
    const to = searchParams.get('to') ? new Date(searchParams.get('to') as string) : null

    const [collected] = await db
      .select({ total: sql<number>`coalesce(sum(${payments.amount}), 0)` })
      .from(payments)
      .where(and(
        eq(payments.schoolId, schoolId),
        eq(payments.paymentStatus, 'completed'),
        from ? sql`${payments.paymentDate} >= ${startOfDay(from)}` : undefined,
        to ? sql`${payments.paymentDate} <= ${endOfDay(to)}` : undefined
      ))

    const [expected] = await db
      .select({ total: sql<number>`coalesce(sum(${invoices.totalAmount}), 0)` })
      .from(invoices)
      .where(eq(invoices.schoolId, schoolId))

    const [outstanding] = await db
      .select({ total: sql<number>`coalesce(sum(${invoices.balanceAmount}), 0)` })
      .from(invoices)
      .where(and(eq(invoices.schoolId, schoolId), sql`${invoices.status} in ('pending', 'partial', 'overdue')`))

    const [overdue] = await db
      .select({ total: sql<number>`coalesce(sum(${invoices.balanceAmount}), 0)`, count: sql<number>`count(*)::int` })
      .from(invoices)
      .where(and(eq(invoices.schoolId, schoolId), sql`${invoices.status} in ('pending', 'partial', 'overdue') and ${invoices.dueDate} < now()`))

    const [expensesTotal] = await db
      .select({ total: sql<number>`coalesce(sum(${expenses.amount}), 0)` })
      .from(expenses)
      .where(and(
        eq(expenses.schoolId, schoolId),
        eq(expenses.status, 'approved'),
        from ? sql`${expenses.expenseDate} >= ${startOfDay(from)}` : undefined,
        to ? sql`${expenses.expenseDate} <= ${endOfDay(to)}` : undefined
      ))

    const [budgetsTotal] = await db
      .select({ allocated: sql<number>`coalesce(sum(${budgets.allocatedAmount}), 0)`, spent: sql<number>`coalesce(sum(${budgets.spentAmount}), 0)` })
      .from(budgets)
      .where(eq(budgets.schoolId, schoolId))

    const [discountsTotal] = await db
      .select({ total: sql<number>`coalesce(sum(${discounts.discountValue}), 0)`, count: sql<number>`count(*)::int` })
      .from(discounts)
      .where(and(eq(discounts.schoolId, schoolId), eq(discounts.isActive, true)))

    const [studentCount] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(students)
      .where(and(eq(students.schoolId, schoolId), sql`${students.status} <> 'deleted'`))

    const agingRows = await db
      .select({
        bucket: sql<string>`
          case
            when now() - ${invoices.dueDate} <= interval '0 days' then 'current'
            when now() - ${invoices.dueDate} <= interval '30 days' then '1-30'
            when now() - ${invoices.dueDate} <= interval '60 days' then '31-60'
            when now() - ${invoices.dueDate} <= interval '90 days' then '61-90'
            else '90+'
          end`,
        amount: sql<number>`coalesce(sum(${invoices.balanceAmount}), 0)`,
        count: sql<number>`count(*)::int`,
      })
      .from(invoices)
      .where(and(eq(invoices.schoolId, schoolId), sql`${invoices.status} in ('pending', 'partial', 'overdue')`))
      .groupBy(sql`1`)

    // Monthly cash flow: payments in vs expenses out for the last 12 months.
    const cashFlow = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${payments.paymentDate}), 'YYYY-MM')`,
        inflow: sql<number>`coalesce(sum(${payments.amount}), 0)`,
      })
      .from(payments)
      .where(and(eq(payments.schoolId, schoolId), eq(payments.paymentStatus, 'completed')))
      .groupBy(sql`1`)
      .orderBy(sql`1 desc`)
      .limit(12)

    const expenseFlow = await db
      .select({
        month: sql<string>`to_char(date_trunc('month', ${expenses.expenseDate}), 'YYYY-MM')`,
        outflow: sql<number>`coalesce(sum(${expenses.amount}), 0)`,
      })
      .from(expenses)
      .where(and(eq(expenses.schoolId, schoolId), eq(expenses.status, 'approved')))
      .groupBy(sql`1`)
      .limit(12)

    const outflowByMonth = new Map(expenseFlow.map((row) => [row.month, round(num(row.outflow))]))

    const collectedValue = round(num(collected?.total))
    const expectedValue = round(num(expected?.total))
    const outstandingValue = round(num(outstanding?.total))

    return ok({
      range: { from: from ? isoDate(from) : null, to: to ? isoDate(to) : null },
      totals: {
        collected: collectedValue,
        expected: expectedValue,
        outstanding: outstandingValue,
        overdue: round(num(overdue?.total)),
        overdueCount: Number(overdue?.count ?? 0),
        collectedRate: expectedValue > 0 ? round((collectedValue / expectedValue) * 100) : 0,
        expenses: round(num(expensesTotal?.total)),
        budgetAllocated: round(num(budgetsTotal?.allocated)),
        budgetSpent: round(num(budgetsTotal?.spent)),
        scholarshipDiscounts: round(num(discountsTotal?.total)),
        scholarshipCount: Number(discountsTotal?.count ?? 0),
        students: Number(studentCount?.count ?? 0),
        netCashFlow: round(collectedValue - num(expensesTotal?.total)),
      },
      aging: agingRows.map((row) => ({ bucket: row.bucket, amount: round(num(row.amount)), count: Number(row.count ?? 0) })),
      cashFlow: cashFlow.map((row) => ({
        month: row.month,
        inflow: round(num(row.inflow)),
        outflow: outflowByMonth.get(row.month) ?? 0,
        net: round(num(row.inflow) - (outflowByMonth.get(row.month) ?? 0)),
      })),
    })
  })(request)
}
