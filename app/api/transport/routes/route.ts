import { db } from '@/lib/db'
import { transportRoutes, vehicles, staff, studentTransport } from '@/lib/db/schema'
import { and, eq, ilike, or, sql, count } from 'drizzle-orm'
import { paged, withV1, parsePagination, parseFilters, num, created, badRequest, conflict, audit } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * Transport routes.
 * GET /api/transport/routes?isActive&query → routes with vehicle/driver joins
 *     and assigned-student counts.
 */
export async function GET(request: NextRequest) {
  return withV1('transport:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['isActive', 'vehicleId', 'driverId', 'shiftType'])
    const query = searchParams.get('query')

    const conditions = [eq(transportRoutes.schoolId, schoolId)]
    if (filters.isActive === 'true') conditions.push(eq(transportRoutes.isActive, true))
    if (filters.isActive === 'false') conditions.push(eq(transportRoutes.isActive, false))
    if (filters.vehicleId) conditions.push(eq(transportRoutes.vehicleId, filters.vehicleId))
    if (filters.driverId) conditions.push(eq(transportRoutes.driverId, filters.driverId))
    if (filters.shiftType) conditions.push(eq(transportRoutes.shiftType, filters.shiftType as never))
    if (query) {
      const q = `%${query}%`
      conditions.push(or(ilike(transportRoutes.name, q), ilike(transportRoutes.routeId, q), ilike(transportRoutes.startPoint, q), ilike(transportRoutes.endPoint, q))!)
    }

    const [totalResult] = await db.select({ count: count() }).from(transportRoutes).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        route: transportRoutes,
        vehicleId: vehicles.id,
        vehicleLabel: vehicles.registrationNumber,
        vehicleType: vehicles.vehicleType,
        driverId: staff.id,
        driverName: staff.fullName,
        studentCount: sql<number>`(
          select count(*)::int from ${studentTransport} st
          where st.route_id = "transport_routes"."id" and st.school_id = ${schoolId} and st.is_active = true
        )`,
      })
      .from(transportRoutes)
      .leftJoin(vehicles, and(eq(transportRoutes.vehicleId, vehicles.id), eq(vehicles.schoolId, schoolId)))
      .leftJoin(staff, and(eq(transportRoutes.driverId, staff.id), eq(staff.schoolId, schoolId)))
      .where(and(...conditions))
      .orderBy(sql`${transportRoutes.routeId} asc`)
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ route, vehicleId, vehicleLabel, vehicleType, driverId, driverName, studentCount }) => ({
        id: route.id,
        schoolId: route.schoolId,
        routeId: route.routeId,
        name: route.name,
        description: route.description,
        startPoint: route.startPoint,
        endPoint: route.endPoint,
        distance: route.distance,
        estimatedTime: route.estimatedTime,
        numberOfStops: route.numberOfStops,
        stops: route.stops,
        feeAmount: route.feeAmount,
        feeAmountValue: num(route.feeAmount),
        shiftType: route.shiftType,
        isActive: route.isActive,
        vehicleId,
        vehicleLabel,
        vehicleType,
        driverId,
        driverName,
        studentCount: studentCount ?? 0,
      })),
      pagination,
      total
    )
  })(request)
}

export async function POST(request: NextRequest) {
  return withV1('transport:write', async ({ user, schoolId }, req) => {
    const body = (await req.json().catch(() => null)) as Record<string, unknown> | null
    if (!body) return badRequest('Invalid JSON body')
    for (const field of ['routeId', 'name', 'startPoint', 'endPoint']) {
      if (typeof body[field] !== 'string' || !String(body[field]).trim()) return badRequest(`${field} is required`)
    }

    const shiftType = body.shiftType ?? 'morning'
    if (!['morning', 'afternoon', 'evening'].includes(String(shiftType))) {
      return badRequest('shiftType must be morning, afternoon or evening')
    }
    const feeAmount = Number(body.feeAmount ?? 0)
    const distance = Number(body.distance ?? 0)
    if (!Number.isFinite(feeAmount) || feeAmount < 0) return badRequest('feeAmount must be a non-negative number')
    if (!Number.isFinite(distance) || distance < 0) return badRequest('distance must be a non-negative number')
    const stops = body.stops === undefined ? [] : body.stops
    if (!Array.isArray(stops) || stops.some((stop) => typeof stop !== 'object' || stop === null)) {
      return badRequest('stops must be an array of stop objects')
    }
    const vehicleId = body.vehicleId === null || body.vehicleId === '' ? null : String(body.vehicleId ?? '')
    const driverId = body.driverId === null || body.driverId === '' ? null : String(body.driverId ?? '')

    if (vehicleId) {
      const [vehicle] = await db.select().from(vehicles)
        .where(and(eq(vehicles.id, vehicleId), eq(vehicles.schoolId, schoolId))).limit(1)
      if (!vehicle) return badRequest('vehicleId must belong to this school')
    }
    if (driverId) {
      const [driver] = await db.select().from(staff)
        .where(and(eq(staff.id, driverId), eq(staff.schoolId, schoolId))).limit(1)
      if (!driver) return badRequest('driverId must belong to this school')
    }

    const routeId = String(body.routeId).trim()
    const [duplicate] = await db.select().from(transportRoutes)
      .where(eq(transportRoutes.routeId, routeId)).limit(1)
    if (duplicate) return conflict('A route with this identifier already exists')

    const [row] = await db.insert(transportRoutes).values({
      id: crypto.randomUUID(),
      schoolId,
      routeId,
      name: String(body.name).trim(),
      description: typeof body.description === 'string' && body.description.trim() ? body.description.trim() : null,
      startPoint: String(body.startPoint).trim(),
      endPoint: String(body.endPoint).trim(),
      distance: distance.toFixed(2),
      estimatedTime: typeof body.estimatedTime === 'string' && body.estimatedTime.trim() ? body.estimatedTime.trim() : null,
      numberOfStops: stops.length,
      stops: stops as never[],
      vehicleId,
      driverId,
      shiftType: shiftType as never,
      feeAmount: feeAmount.toFixed(2),
      isActive: body.isActive !== false,
    }).returning()

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'transport',
      entityType: 'route',
      entityId: row.id,
      changes: { routeId },
    })

    return created({ ...row, feeAmountValue: num(row.feeAmount) })
  })(request)
}
