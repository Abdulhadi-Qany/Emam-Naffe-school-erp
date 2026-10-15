// FIXED: app/api/calendar/route.ts
// Addresses all calendar endpoint issues: CAL-001 through CAL-007

import { db } from '@/lib/db'
import { events, exams, holidays } from '@/lib/db/schema'
import { and, eq, sql } from 'drizzle-orm'
import { ok, badRequest, withV1, isoDate, startOfDay, endOfDay } from '@/lib/api'
import type { NextRequest } from 'next/server'

/**
 * GET /api/calendar?from&to&limit&offset
 * → merged calendar feed (events + exams + holidays) with pagination.
 * 
 * Query Parameters:
 *   - from: ISO date string (inclusive start) - defaults to first day of current month
 *   - to: ISO date string (inclusive end) - defaults to last day of current month
 *   - limit: number of items to return (default: 100, max: 500)
 *   - offset: number of items to skip (default: 0)
 * 
 * Response Format:
 *   {
 *     range: { from: string, to: string },
 *     feed: Array<{
 *       id: string,
 *       title: string,
 *       titleDari?: string,
 *       titlePashto?: string,
 *       date: string (ISO date),
 *       endDate?: string (ISO date),
 *       type: 'event' | 'exam' | 'holiday',
 *       eventType: string,
 *       venue?: string | null,
 *       status: string
 *     }>,
 *     counts: { events: number, exams: number, holidays: number },
 *     pagination: { limit: number, offset: number, total: number }
 *   }
 * 
 * Error Responses:
 *   - 400: Invalid date parameters
 *   - 500: Internal server error (with logged details)
 */
export async function GET(request: NextRequest) {
  return withV1('academics:read', async ({ schoolId }, req) => {
    try {
      const { searchParams } = new URL(req.url)
      const fromParam = searchParams.get('from')
      const toParam = searchParams.get('to')
      
      // Parse and validate limit/offset with safety caps
      const limitParam = parseInt(searchParams.get('limit') || '100', 10)
      const offsetParam = parseInt(searchParams.get('offset') || '0', 10)
      
      const limit = Math.min(Math.max(limitParam, 1), 500) // Cap between 1-500
      const offset = Math.max(offsetParam, 0) // Ensure non-negative
      
      const now = new Date()
      
      // Parse and validate date parameters with bounds checking
      let from: Date
      let to: Date
      
      try {
        from = fromParam 
          ? startOfDay(new Date(fromParam))
          : new Date(now.getFullYear(), now.getMonth(), 1) // First day of current month
        
        to = toParam 
          ? endOfDay(new Date(toParam))
          : endOfDay(new Date(now.getFullYear(), now.getMonth() + 1, 0)) // Last day of current month
      } catch (e) {
        return badRequest('from/to must be valid ISO date strings (YYYY-MM-DD)')
      }
      
      // Validate dates are valid numbers
      if (Number.isNaN(from.getTime()) || Number.isNaN(to.getTime())) {
        return badRequest('from/to must be valid dates')
      }
      
      // Validate to is not before from
      if (to < from) {
        return badRequest('to must be on or after from')
      }
      
      // Prevent excessively large date ranges (max 2 years)
      const MAX_RANGE_MS = 2 * 365 * 24 * 60 * 60 * 1000 // 2 years in milliseconds
      if (to.getTime() - from.getTime() > MAX_RANGE_MS) {
        return badRequest('Date range cannot exceed 2 years')
      }
      
      // Query events with limit/offset applied per source type
      const eventRows = await db
        .select()
        .from(events)
        .where(and(eq(events.schoolId, schoolId), sql`${events.startDate} <= ${to}`, sql`${events.endDate} >= ${from}`))
        .limit(limit)
        .offset(offset)
      
      // Query exams with limit/offset applied per source type
      const examRows = await db
        .select()
        .from(exams)
        .where(and(eq(exams.schoolId, schoolId), sql`${exams.startDate} <= ${to}`, sql`${exams.endDate} >= ${from}`))
        .limit(limit)
        .offset(offset)
      
      // Query holidays with limit/offset applied per source type - NOW INCLUDING LOCALIZATION FIELDS
      const holidayRows = await db
        .select({
          id: holidays.id,
          name: holidays.name,
          nameDari: holidays.nameDari,
          namePashto: holidays.namePashto,
          startDate: holidays.startDate,
          endDate: holidays.endDate,
          holidayType: holidays.holidayType
        })
        .from(holidays)
        .where(and(eq(holidays.schoolId, schoolId), sql`${holidays.startDate} <= ${to}`, sql`${holidays.endDate} >= ${from}`))
        .limit(limit)
        .offset(offset)
      
      // Transform events to feed format
      const eventFeed = eventRows.map((event) => ({
        id: `event-${event.id}`,
        title: event.title,
        date: event.startDate,
        endDate: event.endDate,
        type: 'event' as const,
        eventType: event.eventType,
        venue: event.venue,
        status: event.status
      }))
      
      // Transform exams to feed format
      const examFeed = examRows.map((exam) => ({
        id: `exam-${exam.id}`,
        title: exam.name,
        date: exam.startDate,
        endDate: exam.endDate,
        type: 'exam' as const,
        eventType: 'academic', // Exams are always academic type
        venue: null,
        status: exam.status
      }))
      
      // Transform holidays to feed format - NOW INCLUDING LOCALIZATION FIELDS
      const holidayFeed = holidayRows.map((holiday) => ({
        id: `holiday-${holiday.id}`,
        title: holiday.name,
        titleDari: holiday.nameDari,
        titlePashto: holiday.namePashto,
        date: holiday.startDate,
        endDate: holiday.endDate,
        type: 'holiday' as const,
        eventType: holiday.holidayType,
        venue: null,
        status: 'active' // Holidays are always active
      }))
      
      // Combine and sort all feed items by date
      const feed = [
        ...eventFeed,
        ...examFeed,
        ...holidayFeed
      ]
        .filter((entry) => entry.date && new Date(entry.date).getTime() <= to.getTime()) // Additional safety filter
        .sort((a, b) => new Date(a.date!).getTime() - new Date(b.date!).getTime())
      
      // Apply final pagination to combined feed (for consistent UI experience)
      const paginatedFeed = feed.slice(offset, offset + limit)
      
      // Count total items (without limit/offset) for pagination info
      const [eventCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(events)
        .where(and(eq(events.schoolId, schoolId), sql`${events.startDate} <= ${to}`, sql`${events.endDate} >= ${from}`))
      
      const [examCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(exams)
        .where(and(eq(exams.schoolId, schoolId), sql`${exams.startDate} <= ${to}`, sql`${exams.endDate} >= ${from}`))
      
      const [holidayCountResult] = await db
        .select({ count: sql<number>`count(*)::int` })
        .from(holidays)
        .where(and(eq(holidays.schoolId, schoolId), sql`${holidays.startDate} <= ${to}`, sql`${holidays.endDate} >= ${from}`))
      
      const totalCount = 
        (eventCountResult?.count ?? 0) + 
        (examCountResult?.count ?? 0) + 
        (holidayCountResult?.count ?? 0)
      
      return ok({
        range: { from: isoDate(from), to: isoDate(to) },
        feed: paginatedFeed,
        counts: {
          events: eventCountResult?.count ?? 0,
          exams: examCountResult?.count ?? 0,
          holidays: holidayCountResult?.count ?? 0
        },
        pagination: {
          limit,
          offset,
          total: totalCount
        }
      })
    } catch (error) {
      // Proper error handling with logging (CAL-005)
      console.error('Calendar endpoint error:', error)
      return new Response(
        JSON.stringify({ 
          error: 'internal_error', 
          message: 'An unexpected error occurred while fetching calendar data' 
        }),
        { 
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  })(request)
}