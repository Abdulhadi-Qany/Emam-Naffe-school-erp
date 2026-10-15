import type { ILogger } from '@/src/application/ports/input/ILogger';
import type { IClock } from '@/src/application/ports/input/IClock';
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher';
import type { ISequenceGenerator } from '@/src/shared/domain/shared-kernel';
import type { IStaffRepository } from '../domain/IStaffRepository';
import { HireStaffHandler, type DepartmentChecker } from '../application/HireStaffHandler';
import { ListStaffHandler } from '../application/ListStaffHandler';
import { DrizzleStaffRepository } from './DrizzleStaffRepository';
import { DrizzleDepartmentChecker } from './DrizzleDepartmentChecker';

/**
 * Staff composition root. Wires ports to adapters.
 * Called from the global Container — swap adapters here without touching use cases.
 */
export interface StaffModuleDeps {
  logger: ILogger;
  clock: IClock;
  eventPublisher: IEventPublisher;
  sequences: ISequenceGenerator;
}

export class StaffModule {
  public readonly repository: IStaffRepository;
  public readonly departments: DepartmentChecker;
  public readonly hireStaffHandler: HireStaffHandler;
  public readonly listStaffHandler: ListStaffHandler;

  constructor(deps: StaffModuleDeps) {
    this.repository = new DrizzleStaffRepository();
    this.departments = new DrizzleDepartmentChecker();
    this.hireStaffHandler = new HireStaffHandler(
      this.repository,
      deps.sequences,
      this.departments,
      deps.clock,
      deps.eventPublisher,
      deps.logger,
    );
    this.listStaffHandler = new ListStaffHandler(this.repository);
  }
}
