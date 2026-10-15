import type { ILogger } from '@/src/application/ports/input/ILogger';
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher';
import { GenericDrizzleRepository, type GenericModuleConfig } from './GenericDrizzleRepository';
import { CreateGenericHandler, UpdateGenericHandler, ListGenericHandler } from './GenericHandlers';

/**
 * Registry of every generic-CRUD bounded context.
 * Each entry: kind (domain name) + Drizzle table + permission prefix.
 * Rich modules (Student/Staff/Invoice) keep bespoke classes; everything
 * else goes through this registry — full Clean layering, zero duplication.
 */
export interface ModuleRegistration extends GenericModuleConfig {
  permission: string;
  route: string;
}

export class GenericModule {
  public readonly repository: GenericDrizzleRepository;
  public readonly createHandler: CreateGenericHandler;
  public readonly updateHandler: UpdateGenericHandler;
  public readonly listHandler: ListGenericHandler;

  constructor(
    public readonly registration: ModuleRegistration,
    logger: ILogger,
    events: IEventPublisher,
  ) {
    this.repository = new GenericDrizzleRepository(registration);
    this.createHandler = new CreateGenericHandler(registration.kind, this.repository, events, logger);
    this.updateHandler = new UpdateGenericHandler(this.repository, events);
    this.listHandler = new ListGenericHandler(this.repository);
  }
}

export function buildGenericModules(
  registrations: ModuleRegistration[],
  logger: ILogger,
  events: IEventPublisher,
): Map<string, GenericModule> {
  const map = new Map<string, GenericModule>();
  for (const r of registrations) map.set(r.kind, new GenericModule(r, logger, events));
  return map;
}
