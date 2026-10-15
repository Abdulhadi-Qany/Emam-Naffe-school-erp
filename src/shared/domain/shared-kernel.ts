import { DomainError } from '@/src/domain/errors/DomainError';

/** Shared Kernel — EntityId: UUID identity for every aggregate. */
const UUID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

export class EntityId {
  private readonly value: string;
  private constructor(value: string) {
    this.value = value;
  }
  public static generate(): EntityId {
    return new EntityId(crypto.randomUUID());
  }
  public static fromString(value: string): EntityId {
    if (!value || value.trim().length === 0) throw new DomainError('Id cannot be empty');
    if (!UUID_PATTERN.test(value)) throw new DomainError(`Invalid Id format: ${value}`);
    return new EntityId(value);
  }
  public getValue(): string {
    return this.value;
  }
  public equals(other: EntityId): boolean {
    return this.value === other.value;
  }
  public toString(): string {
    return this.value;
  }
}

/** Shared Kernel — SchoolId: every aggregate is school-scoped. */
export class SchoolId {
  private readonly value: string;
  private constructor(value: string) {
    this.value = value;
  }
  public static fromString(value: string): SchoolId {
    if (!value || value.trim().length === 0) throw new DomainError('SchoolId cannot be empty');
    return new SchoolId(value);
  }
  public getValue(): string {
    return this.value;
  }
  public equals(other: SchoolId): boolean {
    return this.value === other.value;
  }
  public toString(): string {
    return this.value;
  }
}

/** Shared Kernel — Pagination + generic paginated result for ALL repositories. */
export interface PaginationOptions {
  page: number;
  limit: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export function normalizePagination(input?: Partial<PaginationOptions>): Required<Pick<PaginationOptions, 'page' | 'limit'>> & PaginationOptions {
  const page = Math.max(1, input?.page ?? 1);
  const limit = Math.min(100, Math.max(1, input?.limit ?? 20));
  return { page, limit, sortBy: input?.sortBy ?? 'createdAt', sortOrder: input?.sortOrder ?? 'desc' };
}

/** Shared Kernel — base repository contract every IRepository extends. */
export interface IRepository<TAggregate, TId> {
  findById(id: TId): Promise<TAggregate | null>;
  save(entity: TAggregate): Promise<void>;
  update(entity: TAggregate): Promise<void>;
  delete(id: TId): Promise<void>;
}

/** Shared Kernel — domain service for sequential codes (admission/employee/invoice...). */
export interface ISequenceGenerator {
  next(key: string, schoolId: string): Promise<number>;
}
