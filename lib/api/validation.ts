/**
 * Tiny request validator — no external dependency.
 *
 * Route usage:
 * ```ts
 * const parsed = await parseBody(req, {
 *   firstName: { type: 'string', required: true, min: 2, label: 'FirstName' },
 *   gender: { type: 'string', required: true, enum: ['male', 'female'] },
 *   gradeId: { type: 'uuid' },
 *   documents: { type: 'array', required: false },
 * })
 * if (!parsed.ok) return parsed.response // 400 with field errors
 * const { firstName, gender } = parsed.data
 * ```
 */

import { NextResponse } from 'next/server'

export type FieldSchema =
  | { type: 'string'; required?: boolean; min?: number; max?: number; enum?: readonly string[]; pattern?: RegExp; label?: string }
  | { type: 'number'; required?: boolean; min?: number; max?: number; int?: boolean; label?: string }
  | { type: 'boolean'; required?: boolean; label?: string }
  | { type: 'date'; required?: boolean; label?: string }
  | { type: 'uuid'; required?: boolean; label?: string }
  | { type: 'array'; required?: boolean; max?: number; label?: string }
  | { type: 'object'; shape: Schema; required?: boolean; label?: string }

export type Schema = Record<string, FieldSchema>

export type Validated<T extends Schema> = {
  [K in keyof T]: T[K] extends { type: 'boolean' }
    ? boolean
    : T[K] extends { type: 'number' }
      ? number
      : T[K] extends { type: 'array' }
        ? unknown[]
        : T[K] extends { type: 'object' }
          ? Record<string, unknown>
          : string
}

const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i

function label(schema: FieldSchema, field: string): string {
  return schema.label ?? field
}

function isEmpty(value: unknown): boolean {
  return value === undefined || value === null || value === ''
}

function validateField(field: string, schema: FieldSchema, value: unknown, errors: Record<string, string>): unknown {
  const labelText = label(schema, field)

  if (isEmpty(value)) {
    if (schema.required) errors[field] = `${labelText} is required`
    return undefined
  }

  switch (schema.type) {
    case 'string': {
      if (typeof value !== 'string') {
        errors[field] = `${labelText} must be a string`
        return undefined
      }
      if (schema.min !== undefined && value.trim().length < schema.min) {
        errors[field] = `${labelText} must be at least ${schema.min} characters`
        return undefined
      }
      if (schema.max !== undefined && value.length > schema.max) {
        errors[field] = `${labelText} must be at most ${schema.max} characters`
        return undefined
      }
      if (schema.enum && !schema.enum.includes(value)) {
        errors[field] = `${labelText} must be one of: ${schema.enum.join(', ')}`
        return undefined
      }
      if (schema.pattern && !schema.pattern.test(value)) {
        errors[field] = `${labelText} is invalid`
        return undefined
      }
      return value
    }
    case 'number': {
      if (typeof value !== 'number' && typeof value !== 'string') {
        errors[field] = `${labelText} must be a number`
        return undefined
      }
      const parsed = Number(value)
      if (!Number.isFinite(parsed)) {
        errors[field] = `${labelText} must be a valid number`
        return undefined
      }
      if (schema.int && !Number.isInteger(parsed)) {
        errors[field] = `${labelText} must be a whole number`
        return undefined
      }
      if (schema.min !== undefined && parsed < schema.min) {
        errors[field] = `${labelText} must be ${schema.min} or more`
        return undefined
      }
      if (schema.max !== undefined && parsed > schema.max) {
        errors[field] = `${labelText} must be ${schema.max} or less`
        return undefined
      }
      return parsed
    }
    case 'boolean': {
      if (typeof value === 'boolean') return value
      if (value === 'true') return true
      if (value === 'false') return false
      errors[field] = `${labelText} must be a boolean`
      return undefined
    }
    case 'date': {
      const raw = typeof value === 'string' ? value : null
      if (!raw) {
        errors[field] = `${labelText} must be a date`
        return undefined
      }
      const parsed = new Date(raw)
      if (Number.isNaN(parsed.getTime())) {
        errors[field] = `${labelText} must be a valid date`
        return undefined
      }
      return raw
    }
    case 'uuid': {
      if (typeof value !== 'string' || !UUID_PATTERN.test(value)) {
        errors[field] = `${labelText} must be a valid id`
        return undefined
      }
      return value
    }
    case 'array': {
      if (!Array.isArray(value)) {
        errors[field] = `${labelText} must be an array`
        return undefined
      }
      if (schema.max !== undefined && value.length > schema.max) {
        errors[field] = `${labelText} must have at most ${schema.max} items`
        return undefined
      }
      return value
    }
    case 'object': {
      if (typeof value !== 'object' || value === null || Array.isArray(value)) {
        errors[field] = `${labelText} must be an object`
        return undefined
      }
      return validateShape(field, schema.shape, value as Record<string, unknown>, errors)
    }
    default: {
      const exhaustive: never = schema
      throw new Error(`Unsupported schema type: ${JSON.stringify(exhaustive)}`)
    }
  }
}

function validateShape(
  prefix: string,
  shape: Schema,
  value: Record<string, unknown>,
  errors: Record<string, string>
): Record<string, unknown> {
  const result: Record<string, unknown> = {}
  for (const [field, schema] of Object.entries(shape)) {
    result[field] = validateField(`${prefix}.${field}`, schema, value[field], errors)
  }
  return result
}

export type ValidationResult<T extends Schema> =
  | { ok: true; data: Validated<T> }
  | { ok: false; response: NextResponse }

/** Validates a JSON body, returning either the coerced data or a 400 response. */
export async function parseBody<T extends Schema>(
  request: Request,
  schema: T
): Promise<ValidationResult<T>> {
  let body: unknown
  try {
    body = await request.json()
  } catch {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Invalid JSON body' }, { status: 400 }),
    }
  }
  if (typeof body !== 'object' || body === null || Array.isArray(body)) {
    return {
      ok: false,
      response: NextResponse.json({ error: 'Request body must be an object' }, { status: 400 }),
    }
  }
  return validateBody(schema, body as Record<string, unknown>)
}

/** Same as `parseBody` for already-parsed objects (e.g. searchParams-derived payloads). */
export function validateBody<T extends Schema>(
  schema: T,
  body: Record<string, unknown>
): ValidationResult<T> {
  const errors: Record<string, string> = {}
  const data = validateShape('', schema, body, errors)
  if (Object.keys(errors).length > 0) {
    return {
      ok: false,
      response: NextResponse.json(
        {
          error: 'Validation failed',
          details: errors,
          fields: Object.entries(errors).map(([field, message]) => ({ field, message })),
        },
        { status: 400 }
      ),
    }
  }
  return { ok: true, data: data as Validated<T> }
}
