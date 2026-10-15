import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { payrollRuns, payslips, salaryStructures, staff } from '@/lib/db/schema'
import { and, count, desc, eq } from 'drizzle-orm'
import { resolveSchoolId } from '@/lib/api/school'
import { nextInSequence } from '@/lib/api/sequence'
import { dateToSolarHijri } from '@/lib/utils/afghanistan'

const num = (value: unknown): number => {
  const parsed = Number(value ?? 0)
  return Number.isFinite(parsed) ? parsed : 0
}

const money = (value: number): string => (Math.round(value * 100) / 100).toFixed(2)

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const status = searchParams.get('status')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '50')
    const offset = (page - 1) * limit
    const schoolId = await resolveSchoolId(searchParams.get('schoolId'))

    const conditions = [eq(payrollRuns.schoolId, schoolId)]
    if (status) conditions.push(eq(payrollRuns.status, status as never))

    const [totalResult] = await db
      .select({ count: count() })
      .from(payrollRuns)
      .where(and(...conditions))
    const total = totalResult?.count || 0

    const data = await db
      .select()
      .from(payrollRuns)
      .where(and(...conditions))
      .orderBy(desc(payrollRuns.periodStart))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      data,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching payroll runs:', error)
    return NextResponse.json({ error: 'Failed to fetch payroll runs' }, { status: 500 })
  }
}

/**
 * Generate a payroll run: computes payslips for every active staff member
 * that has an active salary structure for the requested period.
 */
export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    const periodStart = body.periodStart ? new Date(body.periodStart) : null
    const periodEnd = body.periodEnd ? new Date(body.periodEnd) : null
    if (!periodStart || !periodEnd || Number.isNaN(periodStart.getTime()) || Number.isNaN(periodEnd.getTime())) {
      return NextResponse.json({ error: 'periodStart and periodEnd are required dates' }, { status: 400 })
    }
    if (periodEnd < periodStart) {
      return NextResponse.json({ error: 'periodEnd must be on or after periodStart' }, { status: 400 })
    }

    const schoolId = await resolveSchoolId(body.schoolId)
    const solarPeriod = dateToSolarHijri(periodStart)
    const periodLabel =
      (body.periodLabel as string | undefined)?.trim() ||
      `${solarPeriod.year}-${String(solarPeriod.month).padStart(2, '0')}`

    const [existingRun] = await db
      .select({ id: payrollRuns.id })
      .from(payrollRuns)
      .where(and(eq(payrollRuns.schoolId, schoolId), eq(payrollRuns.periodLabel, periodLabel)))
      .limit(1)
    if (existingRun) {
      return NextResponse.json({ error: `A payroll run for ${periodLabel} already exists` }, { status: 409 })
    }

    const activeStaff = await db
      .select({ id: staff.id, fullName: staff.fullName })
      .from(staff)
      .where(and(eq(staff.schoolId, schoolId), eq(staff.status, 'active')))

    const structures = await db
      .select({ staffId: salaryStructures.staffId, structure: salaryStructures })
      .from(salaryStructures)
      .where(and(eq(salaryStructures.schoolId, schoolId), eq(salaryStructures.isActive, true)))
    const structureByStaff = new Map(structures.map((row) => [row.staffId, row.structure]))

    const warnings: string[] = []
    const slipRows: (typeof payslips.$inferInsert)[] = []
    let totalGross = 0
    let totalDeductions = 0
    let totalNet = 0

    for (const member of activeStaff) {
      const structure = structureByStaff.get(member.id)
      if (!structure) {
        warnings.push(`${member.fullName} has no active salary structure`)
        continue
      }

      const basic = num(structure.basicSalary)
      const house = num(structure.houseAllowance)
      const transport = num(structure.transportAllowance)
      const food = num(structure.foodAllowance)
      const position = num(structure.positionAllowance)
      const bonus = num(structure.performanceBonus)
      const overtimePay = 0
      const gross = basic + house + transport + food + position + bonus + overtimePay

      const tax = num(structure.taxDeduction)
      const loan = num(structure.loanDeduction)
      const other = num(structure.otherDeductions)
      const absence = 0
      const totalDed = tax + loan + other + absence
      const net = Math.max(0, gross - totalDed)

      totalGross += gross
      totalDeductions += totalDed
      totalNet += net

      slipRows.push({
        id: crypto.randomUUID(),
        schoolId,
        payrollRunId: '', // populated after the run row is inserted
        staffId: member.id,
        slipNumber: '', // populated below
        basicSalary: money(basic),
        houseAllowance: money(house),
        transportAllowance: money(transport),
        foodAllowance: money(food),
        positionAllowance: money(position),
        performanceBonus: money(bonus),
        overtimePay: money(overtimePay),
        grossSalary: money(gross),
        taxDeduction: money(tax),
        loanRepayment: money(loan),
        absenceDeduction: money(absence),
        otherDeductions: money(other),
        totalDeductions: money(totalDed),
        netSalary: money(net),
        paymentMethod: (structure.paymentMethod ?? 'bank_transfer') as never,
        status: 'pending',
      })
    }


    if (slipRows.length === 0) {
      return NextResponse.json(
        {
          error:
            'No payroll could be generated. Add active salary structures for staff before running payroll.',
          warnings,
        },
        { status: 422 }
      )
    }

    const slipPrefix = `EBPS-PAY-${solarPeriod.year}`

    const run = await db.transaction(async (tx) => {
      const [createdRun] = await tx
        .insert(payrollRuns)
        .values({
          id: crypto.randomUUID(),
          schoolId,
          periodLabel,
          periodStart,
          periodEnd,
          status: 'draft',
          employeeCount: slipRows.length,
          totalGross: money(totalGross),
          totalDeductions: money(totalDeductions),
          totalNet: money(totalNet),
          notes: body.notes || null,
          generatedBy: null,
        })
        .returning()

      const preparedSlips: (typeof payslips.$inferInsert)[] = []
      for (const row of slipRows) {
        const sequence = await nextInSequence('payslip', schoolId, tx)
        preparedSlips.push({
          ...row,
          payrollRunId: createdRun.id,
          slipNumber: `${slipPrefix}-${String(sequence).padStart(4, '0')}`,
        })
      }
      await tx.insert(payslips).values(preparedSlips)

      return createdRun
    })

    return NextResponse.json({ run, warnings, payslipCount: slipRows.length }, { status: 201 })
  } catch (error) {
    console.error('Error generating payroll run:', error)
    const message = error instanceof Error ? error.message : 'Failed to generate payroll run'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

