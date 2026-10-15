import { db } from '@/lib/db';
import { eq, and, ilike, or, count, sql } from 'drizzle-orm';
import type { PaginatedResult, PaginationOptions } from '@/src/shared/domain/shared-kernel';
import { normalizePagination } from '@/src/shared/domain/shared-kernel';
import { GenericEntity } from './GenericEntity';

export interface GenericFilters {
  schoolId?: string;
  query?: string;
  status?: string;
}

export interface GenericModuleConfig {
  kind: string;
  table: Record<string, never>;
  tableName: string;
  /** DB column holding the display name (default 'name'). */
  nameColumn?: string;
  /** Extra searchable columns beyond name/code. */
  extraSearchColumns?: string[];
  /** Fixed extra where conditions (e.g. type discriminators). */
  extraWhere?: (t: Record<string, never>) => unknown[];
}

function toCleanDate(v: unknown): Date {
  if (v instanceof Date) return v;
  if (typeof v === 'string' || typeof v === 'number') {
    const d = new Date(v);
    if (!Number.isNaN(d.getTime())) return d;
  }
  return new Date();
}

/**
 * Generic Drizzle repository — ONE Clean adapter serving every
 * reference-data module. Mapped through GenericEntity so use-cases
 * stay framework-free.
 */
export class GenericDrizzleRepository {
  constructor(private readonly config: GenericModuleConfig) {}

  private get t(): Record<string, never> {
    return this.config.table;
  }

  public async save(e: GenericEntity): Promise<void> {
    await db.insert(this.config.table as never).values(this.toRow(e) as never);
  }

  public async update(e: GenericEntity): Promise<void> {
    await db
      .update(this.config.table as never)
      .set({ ...this.toRow(e), updatedAt: new Date() } as never)
      .where(eq(this.t.id as never, e.getIdValue() as never));
  }

  public async delete(id: string): Promise<void> {
    await db.delete(this.config.table as never).where(eq(this.t.id as never, id as never));
  }

  public async findById(id: string): Promise<GenericEntity | null> {
    const [row] = await db
      .select()
      .from(this.config.table as never)
      .where(eq(this.t.id as never, id as never))
      .limit(1);
    return row ? this.toDomain(row as Record<string, unknown>) : null;
  }

  public async findAll(filters?: GenericFilters, pagination?: PaginationOptions): Promise<PaginatedResult<GenericEntity>> {
    const p = normalizePagination(pagination);
    const t = this.t;
    const conditions: unknown[] = [];
    if (t.schoolId && filters?.schoolId) conditions.push(eq(t.schoolId as never, filters.schoolId as never));
    if (t.status && filters?.status) conditions.push(eq(t.status as never, filters.status as never));
    if (this.config.extraWhere) conditions.push(...this.config.extraWhere(t));
    if (filters?.query && (t as Record<string, unknown>)[this.config.nameColumn ?? 'name']) {
      const q = `%${filters.query}%`;
      const cols = [t[this.config.nameColumn ?? 'name'], t.code, ...(this.config.extraSearchColumns ?? []).map((c) => t[c])].filter(Boolean);
      if (cols.length > 0) conditions.push(or(...cols.map((c) => ilike(c as never, q as never)))!);
    }
    const where = conditions.length > 0 ? and(...(conditions as never[])) : undefined;
    const countQuery = db.select({ count: count() }).from(this.config.table as never);
    const [totalRow] = (where ? countQuery.where(where as never) : countQuery) as unknown as [{ count: number } | undefined];
    const total = totalRow?.count ?? 0;
    const orderCol = (t.updatedAt ?? t.createdAt ?? t.id) as never;
    const rows = await db
      .select()
      .from(this.config.table as never)
      .where(where as never)
      .orderBy(sql`${orderCol} desc`)
      .limit(p.limit)
      .offset((p.page - 1) * p.limit);
    return {
      data: rows.map((r) => this.toDomain(r as Record<string, unknown>)),
      total,
      page: p.page,
      limit: p.limit,
      totalPages: Math.max(1, Math.ceil(total / p.limit)),
    };
  }

  public toDomain(row: Record<string, unknown>): GenericEntity {
    const nameCol = this.config.nameColumn ?? 'name';
    const attrs: Record<string, unknown> = { ...row };
    delete attrs.id;
    delete attrs.schoolId;
    delete attrs.school_id;
    delete attrs[nameCol];
    delete attrs.title;
    delete attrs.subject;
    delete attrs.code;
    delete attrs.status;
    delete attrs.createdAt;
    delete attrs.created_at;
    delete attrs.updatedAt;
    delete attrs.updated_at;
    const fallbackName =
      row[nameCol] ?? row.title ?? row.subject ?? row.entityType ?? row.reason ??
      row.grade ?? row.result ?? row.dayOfWeek ?? row.category ?? row.key ??
      row.fileName ?? row.invoiceNumber ?? row.receiptNumber ?? row.status ?? row.id ?? '';
    return GenericEntity.reconstitute(this.config.kind, {
      id: String(row.id),
      schoolId: String(row.schoolId ?? row.school_id ?? ''),
      name: String(fallbackName),
      code: row.code !== undefined && row.code !== null ? String(row.code) : undefined,
      status: row.status !== undefined && row.status !== null ? String(row.status) : 'active',
      attributes: attrs,
      createdAt: toCleanDate(row.createdAt ?? row.created_at),
      updatedAt: toCleanDate(row.updatedAt ?? row.updated_at),
    });
  }

  public toRow(e: GenericEntity): Record<string, unknown> {
    const p = e.toProps();
    const t = this.t;
    const nameCol = this.config.nameColumn ?? 'name';
    const row: Record<string, unknown> = {
      id: p.id,
      ...(t.schoolId ? { schoolId: p.schoolId || null } : {}),
      ...(t[nameCol] ? { [nameCol]: p.name } : {}),
      ...(t.code ? { code: p.code ?? null } : {}),
      ...(t.status ? { status: p.status } : {}),
      ...p.attributes,
    };
    return row;
  }
}
