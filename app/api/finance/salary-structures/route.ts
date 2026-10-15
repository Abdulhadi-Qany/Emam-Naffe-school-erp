import { NextRequest, NextResponse } from 'next/server'
import { db } from '@/lib/db'
import { salaryStructures, staff } from '@/lib/db/schema'
import { and, desc, eq, ilike, or, count } from 'drizzle-orm'
import { resolveSchoolId } from '@/lib/api/school'

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

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('query')
    const staffId = searchParams.get('staffId')
    const active = searchParams.get('active')
    const page = parseInt(searchParams.get('page') || '1')
    const limit = parseInt(searchParams.get('limit') || '100')
    const offset = (page - 1) * limit

    const conditions = []
    if (staffId) conditions.push(eq(salaryStructures.staffId, staffId))
    if (active === 'true') conditions.push(eq(salaryStructures.isActive, true))
    if (active === 'false') conditions.push(eq(salaryStructures.isActive, false))
    if (query) {
      const q = `%${query}%`
      conditions.push(
        or(
          ilike(staff.fullName, q),
          ilike(staff.employeeCode, q),
          ilike(staff.designation, q),
          ilike(salaryStructures.bankName, q),
          ilike(salaryStructures.accountNumber, q)
        )!
      )
    }

    const [totalResult] = await db
      .select({ count: count() })
      .from(salaryStructures)
      .innerJoin(staff, eq(salaryStructures.staffId, staff.id))
    const total = totalResult?.count || 0

    const rows = await db
      .select({
        structure: salaryStructures,
        staffName: staff.fullName,
        employeeCode: staff.employeeCode,
        designation: staff.designation,
        departmentId: staff.departmentId,
        staffStatus: staff.status,
      })
      .from(salaryStructures)
      .innerJoin(staff, eq(salaryStructures.staffId, staff.id))
      .where(conditions.length ? and(...conditions) : undefined)
      .orderBy(desc(salaryStructures.createdAt))
      .limit(limit)
      .offset(offset)

    return NextResponse.json({
      data: rows.map(({ structure, staffName, employeeCode, designation, departmentId, staffStatus }) => ({
        ...structure,
        staffName,
        employeeCode,
        designation,
        departmentId,
        staffStatus,
      })),
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
        hasMore: page * limit < total,
      },
    })
  } catch (error) {
    console.error('Error fetching salary structures:', error)
    return NextResponse.json({ error: 'Failed to fetch salary structures' }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()

    if (!body.staffId) {
      return NextResponse.json({ error: 'Missing required fields: staffId' }, { status: 400 })
    }

    const schoolId = await resolveSchoolId(body.schoolId)

    const [staffMember] = await db
      .select({ id: staff.id, status: staff.status })
      .from(staff)
      .where(eq(staff.id, body.staffId))
    if (!staffMember) {
      return NextResponse.json({ error: 'Staff member not found' }, { status: 404 })
    }

    const existing = await db
      .select({ id: salaryStructures.id })
      .from(salaryStructures)
      .where(eq(salaryStructures.staffId, body.staffId))
      .limit(1)
    if (existing.length > 0) {
      return NextResponse.json(
        { error: 'A salary structure already exists for this staff member' },
        { status: 409 }
      )
    }

    const values: Record<string, unknown> = { id: crypto.randomUUID(), schoolId, staffId: body.staffId }
    for (const field of MONEY_FIELDS) values[field] = normalizeMoney(body[field], field)
    values.bankName = body.bankName || null
    values.bankBranch = body.bankBranch || null
    values.accountNumber = body.accountNumber || null
    values.accountHolder = body.accountHolder || null
    values.paymentMethod = body.paymentMethod || 'bank_transfer'
    values.isActive = body.isActive !== false
    values.notes = body.notes || null

    const [created] = await db.insert(salaryStructures).values(values as never).returning()
    return NextResponse.json(created, { status: 201 })
  } catch (error) {
    console.error('Error creating salary structure:', error)
    const message = error instanceof Error ? error.message : 'Failed to create salary structure'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
