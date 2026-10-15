import { db } from '@/lib/db'
import { libraryMembers, students, staff } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { paged, created, badRequest, withV1, audit, parsePagination, parseFilters, num } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('library:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['memberType', 'isActive', 'studentId'])
    const query = searchParams.get('query')

    const conditions = [eq(libraryMembers.schoolId, schoolId)]
    if (filters.memberType) conditions.push(eq(libraryMembers.memberType, filters.memberType))
    if (filters.isActive === 'true') conditions.push(eq(libraryMembers.isActive, true))
    if (filters.isActive === 'false') conditions.push(eq(libraryMembers.isActive, false))
    if (filters.studentId) conditions.push(eq(libraryMembers.studentId, filters.studentId))

    const rows = await db
      .select({
        member: libraryMembers,
        studentName: students.fullName,
        staffName: staff.fullName,
      })
      .from(libraryMembers)
      .leftJoin(students, eq(libraryMembers.studentId, students.id))
      .leftJoin(staff, eq(libraryMembers.staffId, staff.id))
      .where(and(...conditions))
      .orderBy(sql`${libraryMembers.joinedDate} desc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ member, studentName, staffName }) => ({
        ...member,
        name: studentName ?? staffName ?? member.memberId,
        finePerDayValue: num(member.finePerDay),
      })),
      pagination,
      rows.length
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('library:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    if (!body.studentId && !body.staffId) return badRequest('studentId or staffId is required')

    const where = body.studentId
      ? and(eq(libraryMembers.schoolId, schoolId), eq(libraryMembers.studentId, body.studentId as string))
      : and(eq(libraryMembers.schoolId, schoolId), eq(libraryMembers.staffId, body.staffId as string))

    const [existing] = await db.select({ id: libraryMembers.id }).from(libraryMembers).where(where).limit(1)
    if (existing) return badRequest('This person already has a library membership', 'DUPLICATE')

    const memberId = `LIB-${crypto.randomUUID().slice(0, 6).toUpperCase()}`
    const [createdRow] = (await db
      .insert(libraryMembers)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        memberId,
        userId: null,
        studentId: (body.studentId as string) ?? null,
        staffId: (body.staffId as string) ?? null,
        memberType: body.studentId ? 'student' : 'staff',
        maxBooks: body.maxBooks !== undefined ? Number(body.maxBooks) : 3,
        loanPeriod: body.loanPeriod !== undefined ? Number(body.loanPeriod) : 14,
        renewalLimit: body.renewalLimit !== undefined ? Number(body.renewalLimit) : 2,
        finePerDay: body.finePerDay !== undefined ? String(body.finePerDay) : '5',
        isActive: body.isActive !== false,
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'library',
      entityType: 'library_member',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
