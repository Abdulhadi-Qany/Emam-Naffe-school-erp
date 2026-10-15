import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher';
import type { ILogger } from '@/src/application/ports/input/ILogger';
import type { ICommand, ListQuery } from '@/src/shared/application/base-handlers';
import { ValidationError } from '@/src/application/exceptions';
import { normalizePagination } from '@/src/shared/domain/shared-kernel';
import { GenericEntity } from './GenericEntity';
import { GenericDrizzleRepository, type GenericFilters } from './GenericDrizzleRepository';

export interface CreateGenericCommand extends ICommand {
  schoolId: string;
  name: string;
  code?: string;
  status?: string;
  attributes?: Record<string, unknown>;
  createdBy: string;
}

export interface UpdateGenericCommand extends ICommand {
  id: string;
  schoolId: string;
  name?: string;
  code?: string;
  status?: string;
  attributes?: Record<string, unknown>;
}

export interface GenericItemResponse {
  id: string;
  schoolId: string;
  kind: string;
  name: string;
  code?: string;
  status: string;
  attributes: Record<string, unknown>;
  createdAt: string;
  updatedAt: string;
}

/** Generic CREATE use-case — validates, builds entity, saves, publishes. */
export class CreateGenericHandler {
  constructor(
    private readonly kind: string,
    private readonly repo: GenericDrizzleRepository,
    private readonly events: IEventPublisher,
    private readonly logger: ILogger,
  ) {}

  public async execute(cmd: CreateGenericCommand): Promise<GenericItemResponse> {
    if (!cmd.schoolId?.trim()) throw new ValidationError('schoolId is required', { schoolId: 'required' });
    if (!cmd.name?.trim()) throw new ValidationError('name is required', { name: 'required' });
    const e = GenericEntity.create(this.kind, {
      schoolId: cmd.schoolId,
      name: cmd.name,
      code: cmd.code,
      status: cmd.status ?? 'active',
      attributes: cmd.attributes ?? {},
    });
    await this.repo.save(e);
    await this.events.publishAll(e.pullDomainEvents());
    this.logger.info(`${this.kind} created`, { id: e.getIdValue() });
    return toResponse(e);
  }
}

/** Generic UPDATE use-case. */
export class UpdateGenericHandler {
  constructor(
    private readonly repo: GenericDrizzleRepository,
    private readonly events: IEventPublisher,
  ) {}

  public async execute(cmd: UpdateGenericCommand): Promise<GenericItemResponse> {
    const e = await this.repo.findById(cmd.id);
    if (!e) throw new ValidationError(`${cmd.id} not found`, { id: 'not-found' });
    e.update({ name: cmd.name, code: cmd.code, status: cmd.status, attributes: cmd.attributes });
    await this.repo.update(e);
    await this.events.publishAll(e.pullDomainEvents());
    return toResponse(e);
  }
}

/** Generic LIST use-case. */
export class ListGenericHandler {
  constructor(private readonly repo: GenericDrizzleRepository) {}

  public async execute(q: ListQuery<GenericFilters> & { schoolId: string }) {
    const p = normalizePagination(q.pagination);
    const r = await this.repo.findAll({ schoolId: q.schoolId, query: q.filters?.query, status: q.filters?.status }, p);
    return { ...r, data: r.data.map(toResponse) };
  }
}

export function toResponse(e: GenericEntity): GenericItemResponse {
  const p = e.toProps();
  return {
    id: p.id,
    schoolId: p.schoolId,
    kind: e.getKind(),
    name: p.name,
    code: p.code,
    status: p.status,
    attributes: p.attributes,
    createdAt: p.createdAt.toISOString(),
    updatedAt: p.updatedAt.toISOString(),
  };
}
