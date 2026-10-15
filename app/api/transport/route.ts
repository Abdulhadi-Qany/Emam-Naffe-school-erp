import { db } from '@/lib/db'
import { transportRoutes, vehicles, studentTransport, vehicleMaintenance } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, withV1 } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/transport — transport dashboard overview (fleet readiness,
 * assignment coverage, upcoming maintenance).
 */
export async function GET(request: NextRequest) {
  return withV1('transport:read', async ({ schoolId }) => {
    const [routeCount] = await db
      .select({ total: sql`count(*)::int`.as('total') })
      .from(transportRoutes)
      .where(and(eq(transportRoutes.schoolId, schoolId), eq(transportRoutes.isActive, true)))

    const [studentCount] = await db
      .select({ total: sql`count(*)::int`.as('total') })
      .from(studentTransport)
      .where(and(eq(studentTransport.schoolId, schoolId), eq(studentTransport.isActive, true)))

    const [vehicleCount] = await db
      .select({ total: sql`count(*)::int`.as('total') })
      .from(vehicles)
      .where(and(eq(vehicles.schoolId, schoolId), eq(vehicles.status, 'active')))

    const [driverCount] = await db
      .select({ total: sql`count(distinct ${transportRoutes.driverId})::int`.as('total') })
      .from(transportRoutes)
      .where(and(
        eq(transportRoutes.schoolId, schoolId),
        eq(transportRoutes.isActive, true),
        sql`${transportRoutes.driverId} is not null`
      ))

    const [maintenanceDue] = await db
      .select({ total: sql`count(*)::int`.as('total') })
      .from(vehicleMaintenance)
      .innerJoin(vehicles, eq(vehicleMaintenance.vehicleId, vehicles.id))
      .where(and(eq(vehicles.schoolId, schoolId), eq(vehicleMaintenance.status, 'scheduled')))

    const routes = await db
      .select({
        routeId: transportRoutes.routeId,
        name: transportRoutes.name,
        isActive: transportRoutes.isActive,
      })
      .from(transportRoutes)
      .where(eq(transportRoutes.schoolId, schoolId))
      .orderBy(sql`${transportRoutes.routeId} asc`)
      .limit(500)

    return ok({
      totals: {
        activeRoutes: Number(routeCount?.total ?? 0),
        assignedStudents: Number(studentCount?.total ?? 0),
        activeVehicles: Number(vehicleCount?.total ?? 0),
        activeDrivers: Number(driverCount?.total ?? 0),
        maintenanceDue: Number(maintenanceDue?.total ?? 0),
      },
      routes,
    })
  })(request)
}
