import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRuns, payslips, staff } from '@/lib/db/schema'
import { and, desc, eq } from 'drizzle-orm'

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params

    const [run] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, id)).limit(1)
    if (!run) return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })

    const slips = await db
      .select({
        slip: payslips,
        staffName: staff.fullName,
        employeeCode: staff.employeeCode,
        designation: staff.designation,
      })
      .from(payslips)
      .innerJoin(staff, eq(payslips.staffId, staff.id))
      .where(eq(payslips.payrollRunId, id))
      .orderBy(desc(payslips.netSalary))

    return NextResponse.json({
      run,
      payslips: slips.map(({ slip, staffName, employeeCode, designation }) => ({
        ...slip,
        staffName,
        employeeCode,
        designation,
      })),
    })
  } catch (error) {
    console.error('Error fetching payroll run:', error)
    return NextResponse.json({ error: 'Failed to fetch payroll run' }, { status: 500 })
  }
}

/**
 * Payroll workflow actions: approve (draft -> approved),
 * pay (approved -> paid) and cancel (draft/approved -> cancelled).
 */
export async function PATCH(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()
    const action = body.action as string

    const [run] = await db.select().from(payrollRuns).where(eq(payrollRuns.id, id)).limit(1)
    if (!run) return NextResponse.json({ error: 'Payroll run not found' }, { status: 404 })

    const now = new Date()

    if (action === 'approve') {
      if (run.status !== 'draft') {
        return NextResponse.json({ error: 'Only draft runs can be approved' }, { status: 409 })
      }
      const [updated] = await db
        .update(payrollRuns)
        .set({ status: 'approved', approvedAt: now, updatedAt: now })
        .where(eq(payrollRuns.id, id))
        .returning()
      return NextResponse.json({ run: updated })
    }

    if (action === 'pay') {
      if (run.status !== 'approved') {
        return NextResponse.json({ error: 'Only approved runs can be paid' }, { status: 409 })
      }
      const updated = await db.transaction(async (tx) => {
        const [updatedRun] = await tx
          .update(payrollRuns)
          .set({ status: 'paid', paidAt: now, updatedAt: now })
          .where(eq(payrollRuns.id, id))
          .returning()
        await tx
          .update(payslips)
          .set({ status: 'paid', paidAt: now, updatedAt: now })
          .where(and(eq(payslips.payrollRunId, id), eq(payslips.status, 'pending')))
        return updatedRun
      })
      return NextResponse.json({ run: updated })
    }

    if (action === 'cancel') {
      if (run.status !== 'draft' && run.status !== 'approved') {
        return NextResponse.json({ error: 'Paid runs cannot be cancelled' }, { status: 409 })
      }
      const updated = await db.transaction(async (tx) => {
        const [updatedRun] = await tx
          .update(payrollRuns)
          .set({ status: 'cancelled', updatedAt: now })
          .where(eq(payrollRuns.id, id))
          .returning()
        await tx
          .update(payslips)
          .set({ status: 'void', updatedAt: now })
          .where(and(eq(payslips.payrollRunId, id), eq(payslips.status, 'pending')))
        return updatedRun
      })
      return NextResponse.json({ run: updated })
    }

    return NextResponse.json(
      { error: 'Unknown action. Supported actions: approve, pay, cancel' },
      { status: 400 }
    )
  } catch (error) {
    console.error('Error updating payroll run:', error)
    const message = error instanceof Error ? error.message : 'Failed to update payroll run'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
