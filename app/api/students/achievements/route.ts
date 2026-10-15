import { db } from '@/lib/db'
import { studentAchievements, students, userProfiles } from '@/lib/db/schema'
import { and, count, desc, eq, ilike, or } from 'drizzle-orm'
import { paged, parsePagination, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  return withV1('students:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const query = searchParams.get('query')
    const conditions = [eq(studentAchievements.schoolId, schoolId)]

    if (query) {
      const pattern = `%${query}%`
      conditions.push(or(
        ilike(studentAchievements.title, pattern),
        ilike(studentAchievements.achievementType, pattern),
        ilike(studentAchievements.event, pattern),
        ilike(students.fullName, pattern),
        ilike(students.admissionNumber, pattern)
      )!)
    }

    const where = and(...conditions)
    const [total] = await db
      .select({ count: count() })
      .from(studentAchievements)
      .innerJoin(students, and(
        eq(studentAchievements.studentId, students.id),
        eq(students.schoolId, schoolId)
      ))
      .where(where)

    const rows = await db
      .select({
        achievement: studentAchievements,
        studentName: students.fullName,
        admissionNumber: students.admissionNumber,
        recordedByName: userProfiles.fullName,
      })
      .from(studentAchievements)
      .innerJoin(students, and(
        eq(studentAchievements.studentId, students.id),
        eq(students.schoolId, schoolId)
      ))
      .leftJoin(userProfiles, eq(studentAchievements.recordedBy, userProfiles.userId))
      .where(where)
      .orderBy(desc(studentAchievements.date))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(rows.map(({ achievement, studentName, admissionNumber, recordedByName }) => ({
      ...achievement,
      studentName,
      admissionNumber,
      recordedByName,
    })), pagination, total?.count ?? 0)
  })(request)
}
