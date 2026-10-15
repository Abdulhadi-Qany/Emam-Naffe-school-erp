import { AggregateRoot } from '@/src/shared/domain/base';
import { DomainError } from '@/src/domain/errors/DomainError';
import { BaseDomainEvent } from '@/src/shared/domain/base';

/**
 * Generic Clean entity — for reference-data aggregates (grades, subjects,
 * books, vehicles, rooms, items, announcements...) where the invariant is:
 * school-scoped + named + auditable. Rich aggregates (Student/Staff/Invoice)
 * keep their bespoke classes; everything else extends this.
 */
export interface GenericProps {
  id: string;
  schoolId: string;
  name: string;
  code?: string;
  status: string;
  attributes: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class GenericCreatedEvent extends BaseDomainEvent {
  constructor(aggregateId: string, public readonly schoolId: string, public readonly kind: string) {
    super(`${kind}Created`, aggregateId);
  }
}

export class GenericUpdatedEvent extends BaseDomainEvent {
  constructor(aggregateId: string, public readonly schoolId: string, public readonly kind: string) {
    super(`${kind}Updated`, aggregateId);
  }
}

export class GenericDeletedEvent extends BaseDomainEvent {
  constructor(aggregateId: string, public readonly schoolId: string, public readonly kind: string) {
    super(`${kind}Deleted`, aggregateId);
  }
}

export class GenericEntity extends AggregateRoot<GenericProps> {
  constructor(
    props: GenericProps,
    private readonly kind: string,
  ) {
    super(props);
  }

  public static create(kind: string, props: Omit<GenericProps, 'id' | 'createdAt' | 'updatedAt'> & { id?: string }): GenericEntity {
    if (!props.schoolId?.trim()) throw new DomainError('schoolId is required');
    if (!props.name?.trim()) throw new DomainError('name is required');
    const now = new Date();
    const e = new GenericEntity(
      { ...props, name: props.name.trim(), id: props.id ?? crypto.randomUUID(), status: props.status || 'active', attributes: props.attributes ?? {}, createdAt: now, updatedAt: now },
      kind,
    );
    e.addEvent(new GenericCreatedEvent(e.props.id, props.schoolId, kind));
    return e;
  }

  public static reconstitute(kind: string, props: GenericProps): GenericEntity {
    return new GenericEntity(props, kind);
  }

  public update(patch: Partial<Pick<GenericProps, 'name' | 'code' | 'status' | 'attributes'>>): void {
    if (patch.name !== undefined && !patch.name.trim()) throw new DomainError('name cannot be empty');
    Object.assign(this.props as unknown as Record<string, unknown>, {
      ...(patch.name !== undefined ? { name: patch.name.trim() } : {}),
      ...(patch.code !== undefined ? { code: patch.code } : {}),
      ...(patch.status !== undefined ? { status: patch.status } : {}),
      ...(patch.attributes !== undefined ? { attributes: patch.attributes } : {}),
      updatedAt: new Date(),
    });
    this.addEvent(new GenericUpdatedEvent(this.props.id, this.props.schoolId, this.kind));
  }

  public softDelete(): void {
    (this.props as { status: string }).status = 'deleted';
    (this.props as { updatedAt: Date }).updatedAt = new Date();
    this.addEvent(new GenericDeletedEvent(this.props.id, this.props.schoolId, this.kind));
  }

  public getKind(): string {
    return this.kind;
  }
  public getIdValue(): string {
    return this.props.id;
  }
  public getSchoolId(): string {
    return this.props.schoolId;
  }
}
