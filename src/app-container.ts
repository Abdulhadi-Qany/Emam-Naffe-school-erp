import { Container as StudentContainer } from '@/src/infrastructure/ioc/container';
import { StaffModule } from '@/src/modules/staff';
import { FinanceModule } from '@/src/modules/finance';
import { DrizzleSequenceGenerator } from '@/src/shared';
import { buildGenericModules, MODULE_REGISTRATIONS, type GenericModule } from '@/src/shared/crud';
import { UserReadRepository, RoleReadRepository, SequenceReadRepository } from '@/src/shared/identity';
import { AuditReadRepository, SessionReadRepository } from '@/src/shared/identity';

/**
 * GLOBAL COMPOSITION ROOT — Student + Staff + Finance + 132 generic + identity reads.
 * Controllers: getAppContainer().modules.get('Book')!.createHandler.execute(...)
 */
class AppContainer extends StudentContainer {
  public readonly sequences = new DrizzleSequenceGenerator();
  public readonly staff: StaffModule;
  public readonly finance: FinanceModule;
  public readonly modules: Map<string, GenericModule>;
  public readonly identityUsers = new UserReadRepository();
  public readonly identityRoles = new RoleReadRepository();
  public readonly sequenceReads = new SequenceReadRepository();
  public readonly auditReads = new AuditReadRepository();
  public readonly sessionReads = new SessionReadRepository();

  constructor() {
    super();
    const deps = {
      logger: this.logger,
      clock: this.clock,
      eventPublisher: this.eventPublisher,
      sequences: this.sequences,
    };
    this.staff = new StaffModule(deps);
    this.finance = new FinanceModule(deps);
    this.modules = buildGenericModules(MODULE_REGISTRATIONS, this.logger, this.eventPublisher);
  }

  /** Lookup any generic module by kind (e.g. 'Book', 'Exam', 'Vehicle'). */
  public module(kind: string): GenericModule {
    const m = this.modules.get(kind);
    if (!m) throw new Error(`Unknown Clean module: ${kind}`);
    return m;
  }
}

let appSingleton: AppContainer | null = null;

/** Lazily-created application-wide container with ALL Clean modules. */
export function getAppContainer(): AppContainer {
  if (!appSingleton) appSingleton = new AppContainer();
  return appSingleton;
}

export { AppContainer };
