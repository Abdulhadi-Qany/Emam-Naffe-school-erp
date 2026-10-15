import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { salaryStructures } from '@/lib/db/schema'
import { eq } from 'drizzle-orm'

const MONEY_FIELDS = [
  'basicSalary',
  'houseAllowance',
  'transportAllowance',
  'foodAllowance',
  'positionAllowance',
  'performanceBonus',
  'overtimeRate',
  'taxDeduction',
  'loanDeduction',
  'otherDeductions',
] as const

function normalizeMoney(value: unknown, field: string): string {
  if (value === undefined || value === null || value === '') return '0'
  const parsed = Number(value)
  if (!Number.isFinite(parsed) || parsed < 0) throw new Error(`${field} must be a non-negative number`)
  return parsed.toFixed(2)
}

type RouteContext = { params: Promise<{ id: string }> }

export async function GET(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const [record] = await db.select().from(salaryStructures).where(eq(salaryStructures.id, id)).limit(1)
    if (!record) return NextResponse.json({ error: 'Salary structure not found' }, { status: 404 })
    return NextResponse.json(record)
  } catch (error) {
    console.error('Error fetching salary structure:', error)
    return NextResponse.json({ error: 'Failed to fetch salary structure' }, { status: 500 })
  }
}

export async function PUT(request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const body = await request.json()

    const [existing] = await db
      .select({ id: salaryStructures.id })
      .from(salaryStructures)
      .where(eq(salaryStructures.id, id))
      .limit(1)
    if (!existing) return NextResponse.json({ error: 'Salary structure not found' }, { status: 404 })

    const values: Record<string, unknown> = {}
    for (const field of MONEY_FIELDS) {
      if (body[field] !== undefined) values[field] = normalizeMoney(body[field], field)
    }
    if (body.bankName !== undefined) values.bankName = body.bankName || null
    if (body.bankBranch !== undefined) values.bankBranch = body.bankBranch || null
    if (body.accountNumber !== undefined) values.accountNumber = body.accountNumber || null
    if (body.accountHolder !== undefined) values.accountHolder = body.accountHolder || null
    if (body.paymentMethod !== undefined) values.paymentMethod = body.paymentMethod
    if (body.isActive !== undefined) values.isActive = Boolean(body.isActive)
    if (body.notes !== undefined) values.notes = body.notes || null
    values.updatedAt = new Date()

    const [updated] = await db
      .update(salaryStructures)
      .set(values as never)
      .where(eq(salaryStructures.id, id))
      .returning()
    return NextResponse.json(updated)
  } catch (error) {
    console.error('Error updating salary structure:', error)
    const message = error instanceof Error ? error.message : 'Failed to update salary structure'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}

export async function DELETE(_request: NextRequest, context: RouteContext) {
  try {
    const { id } = await context.params
    const [existing] = await db
      .select({ id: salaryStructures.id })
      .from(salaryStructures)
      .where(eq(salaryStructures.id, id))
      .limit(1)
    if (!existing) return NextResponse.json({ error: 'Salary structure not found' }, { status: 404 })

    await db.delete(salaryStructures).where(eq(salaryStructures.id, id))
    return NextResponse.json({ message: 'Salary structure deleted successfully' })
  } catch (error) {
    console.error('Error deleting salary structure:', error)
    return NextResponse.json({ error: 'Failed to delete salary structure' }, { status: 500 })
  }
}
