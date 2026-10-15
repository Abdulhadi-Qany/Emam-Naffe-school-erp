/**
 * SHARED KERNEL — Application base classes.
 * Depends only on shared domain. Every use-case handler extends these.
 */
import type { DomainEvent } from '@/src/shared/domain/base';
import type { ILogger } from '@/src/application/ports/input/ILogger';
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher';

export interface ICommand {
  readonly schoolId: string;
  readonly requestedBy?: string;
}

export interface IQuery {
  readonly schoolId?: string;
  readonly requestedBy?: string;
}

export abstract class CommandHandler<TCommand extends ICommand, TResponse> {
  constructor(
    protected readonly eventPublisher: IEventPublisher,
    protected readonly logger: ILogger,
  ) {}

  public abstract execute(command: TCommand): Promise<TResponse>;

  protected async publishAll(events: DomainEvent[]): Promise<void> {
    if (events.length > 0) await this.eventPublisher.publishAll(events);
  }
}

export abstract class QueryHandler<TQuery extends IQuery, TResponse> {
  public abstract execute(query: TQuery): Promise<TResponse>;
}

/** Standard list-query shape shared by every module. */
export interface ListQuery<TFilters> extends IQuery {
  filters?: TFilters;
  pagination?: { page?: number; limit?: number; sortBy?: string; sortOrder?: 'asc' | 'desc' };
}
