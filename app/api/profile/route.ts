import { db } from '@/lib/db'
import { users, userProfiles, staff, staffRoles } from '@/lib/db/schema'
import { and, eq } from 'drizzle-orm'
import { ok, badRequest, notFound, withV1, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/profile → the signed-in user's profile (profile row, staff record,
 * roles and permissions) for the profile page.
 */
export async function GET(request: NextRequest) {
  return withV1('users:read', async ({ user, schoolId }) => {
    const [profile] = await db
      .select()
      .from(userProfiles)
      .where(eq(userProfiles.userId, user.id))
      .limit(1)

    const [staffRecord] = await db
      .select({
        id: staff.id,
        employeeCode: staff.employeeCode,
        fullName: staff.fullName,
        designation: staff.designation,
        email: staff.email,
        phone: staff.phone,
        photo: staff.photo,
        joinDate: staff.joinDate,
      })
      .from(staff)
      .where(and(eq(staff.email, user.email ?? ''), eq(staff.schoolId, schoolId)))
      .limit(1)

    const roles = await db
      .select({ role: staffRoles.role, permissions: staffRoles.permissions })
      .from(staffRoles)
      .where(and(eq(staffRoles.userId, user.id), eq(staffRoles.schoolId, schoolId)))

    const permissionSet = new Set<string>()
    let isAdmin = false
    for (const role of roles) {
      const permissions = (role.permissions ?? []) as string[]
      if (permissions.includes('*')) isAdmin = true
      for (const permission of permissions) permissionSet.add(permission)
    }

    return ok({
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
      },
      profile: profile ?? null,
      staff: staffRecord ?? null,
      roles: roles.map((role) => role.role),
      permissions: isAdmin ? ['*'] : Array.from(permissionSet),
      isAdmin,
    })
  })(request)
}

export async function PUT(request: NextRequest) {
  return withV1('users:write', async ({ user, schoolId }) => {
    const body = (await request.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')

    const [existing] = await db.select({ id: userProfiles.id }).from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1)

    if (!existing) {
      const displayName = (user.name ?? '').trim() || user.email || 'User'
      const nameParts = displayName.split(/\s+/)
      const firstName = nameParts.shift() || user.email || 'User'
      const familyName = nameParts.join(' ')
      await db.insert(userProfiles).values({
        id: crypto.randomUUID(),
        userId: user.id,
        userType: 'staff',
        firstName,
        fatherName: '',
        familyName,
        fullName: displayName,
        phone: body.phone !== undefined ? (body.phone as string | null) : null,
        emergencyContactName: body.emergencyContactName !== undefined ? (body.emergencyContactName as string | null) : null,
        emergencyContactPhone: body.emergencyContactPhone !== undefined ? (body.emergencyContactPhone as string | null) : null,
        address: body.address !== undefined ? (body.address as string | null) : null,
        city: body.city !== undefined ? (body.city as string | null) : null,
        photo: body.photo !== undefined ? (body.photo as string | null) : null,
      })
    } else {
      await db
        .update(userProfiles)
        .set({
          phone: body.phone !== undefined ? (body.phone as string | null) : undefined,
          emergencyContactName: body.emergencyContactName !== undefined ? (body.emergencyContactName as string | null) : undefined,
          emergencyContactPhone: body.emergencyContactPhone !== undefined ? (body.emergencyContactPhone as string | null) : undefined,
          address: body.address !== undefined ? (body.address as string | null) : undefined,
          city: body.city !== undefined ? (body.city as string | null) : undefined,
          photo: body.photo !== undefined ? (body.photo as string | null) : undefined,
          updatedAt: new Date(),
        })
        .where(eq(userProfiles.userId, user.id))
    }

    await audit({
      schoolId,
      userId: user.id,
      action: 'updated',
      module: 'users',
      entityType: 'user_profile',
      entityId: user.id,
    })

    const [profile] = await db.select().from(userProfiles).where(eq(userProfiles.userId, user.id)).limit(1)
    return ok(profile)
  })(request)
}
