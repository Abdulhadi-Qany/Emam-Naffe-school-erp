import { db } from '@/lib/db'
import { vehicles, staff, transportRoutes } from '@/lib/db/schema'
import { and, count, desc, eq, ilike, or, sql } from 'drizzle-orm'
import { paged, created, ok, badRequest, notFound, withV1, audit, parsePagination, parseFilters, num } from '@/lib/api'
import type { NextRequest } from 'next/server'

const STATUSES = ['active', 'maintenance', 'inactive', 'retired'] as const

/**
 * Vehicles (shared by transport + fleet).
 * GET  /api/transport/vehicles?status&vehicleType&query → joined driver/route usage
 * POST /api/transport/vehicles { registrationNumber, vehicleType, capacity?, ... }
 * PUT  /api/transport/vehicles/[id]
 */
export async function GET(request: NextRequest) {
  return withV1('transport:read', async ({ schoolId }, req) => {
    const { searchParams } = new URL(req.url)
    const pagination = parsePagination(searchParams)
    const filters = parseFilters(searchParams, ['status', 'vehicleType'])
    const query = searchParams.get('query')

    const conditions = [eq(vehicles.schoolId, schoolId)]
    if (filters.status) conditions.push(eq(vehicles.status, filters.status))
    if (filters.vehicleType) conditions.push(eq(vehicles.vehicleType, filters.vehicleType))
    if (query) {
      const q = `%${query}%`
      conditions.push(
        or(
          ilike(vehicles.registrationNumber, q),
          ilike(vehicles.vehicleId, q),
          ilike(vehicles.make, q),
          ilike(vehicles.model, q)
        )!
      )
    }

    const [totalResult] = await db.select({ count: count() }).from(vehicles).where(and(...conditions))
    const total = totalResult?.count ?? 0

    const rows = await db
      .select({
        vehicle: vehicles,
        driverName: staff.fullName,
        routeId: transportRoutes.routeId,
        routeName: transportRoutes.name,
      })
      .from(vehicles)
      .leftJoin(transportRoutes, eq(vehicles.id, transportRoutes.vehicleId))
      .leftJoin(staff, eq(transportRoutes.driverId, staff.id))
      .where(and(...conditions))
      .orderBy(desc(vehicles.createdAt))
      .limit(pagination.limit)
      .offset(pagination.offset)

    return paged(
      rows.map(({ vehicle, driverName, routeId, routeName }) => ({
        ...vehicle,
        purchasePriceValue: num(vehicle.purchasePrice),
        driverName,
        routeId,
        routeName,
        insuranceExpiryLabel: vehicle.insuranceExpiry ? vehicle.insuranceExpiry.toISOString().slice(0, 10) : null,
        registrationExpiryLabel: vehicle.registrationExpiry ? vehicle.registrationExpiry.toISOString().slice(0, 10) : null,
        fitnessExpiryLabel: vehicle.fitnessExpiry ? vehicle.fitnessExpiry.toISOString().slice(0, 10) : null,
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

    for (const field of ['registrationNumber', 'vehicleType']) {
      if (!body[field]) return badRequest(`${field} is required`)
    }
    if (body.status !== undefined && !STATUSES.includes(body.status as (typeof STATUSES)[number])) {
      return badRequest(`status must be one of: ${STATUSES.join(', ')}`)
    }

    const [duplicate] = await db
      .select({ id: vehicles.id })
      .from(vehicles)
      .where(eq(vehicles.registrationNumber, String(body.registrationNumber)))
      .limit(1)
    if (duplicate) return badRequest('A vehicle with this registration number exists')

    const [createdRow] = (await db
      .insert(vehicles)
      .values({
        id: crypto.randomUUID(),
        schoolId,
        vehicleId: (body.vehicleId as string) ?? `VEH-${crypto.randomUUID().slice(0, 6).toUpperCase()}`,
        registrationNumber: String(body.registrationNumber).trim(),
        vehicleType: String(body.vehicleType),
        make: (body.make as string) ?? null,
        model: (body.model as string) ?? null,
        year: body.year !== undefined ? Number(body.year) : null,
        capacity: body.capacity !== undefined ? Number(body.capacity) : 40,
        color: (body.color as string) ?? null,
        insuranceExpiry: body.insuranceExpiry ? new Date(body.insuranceExpiry as string) : null,
        registrationExpiry: body.registrationExpiry ? new Date(body.registrationExpiry as string) : null,
        fitnessExpiry: body.fitnessExpiry ? new Date(body.fitnessExpiry as string) : null,
        purchasePrice: body.purchasePrice !== undefined ? String(body.purchasePrice) : '0',
        status: (body.status as string) ?? 'active',
      })
      .returning()) as unknown as Record<string, unknown>[]

    await audit({
      schoolId,
      userId: user.id,
      action: 'created',
      module: 'transport',
      entityType: 'vehicle',
      entityId: createdRow.id as string,
    })

    return created(createdRow)
  })(request)
}
