import type { ILogger } from '@/src/application/ports/input/ILogger';
import type { IClock } from '@/src/application/ports/input/IClock';
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher';
import type { ISequenceGenerator } from '@/src/shared/domain/shared-kernel';
import type { IInvoiceRepository } from '../domain/IInvoiceRepository';
import { IssueInvoiceHandler, RecordPaymentHandler } from '../application/FinanceHandlers';
import { DrizzleInvoiceRepository } from './DrizzleInvoiceRepository';

/** Finance composition root. */
export interface FinanceModuleDeps {
  logger: ILogger;
  clock: IClock;
  eventPublisher: IEventPublisher;
  sequences: ISequenceGenerator;
}

export class FinanceModule {
  public readonly repository: IInvoiceRepository;
  public readonly issueInvoiceHandler: IssueInvoiceHandler;
  public readonly recordPaymentHandler: RecordPaymentHandler;

  constructor(deps: FinanceModuleDeps) {
    this.repository = new DrizzleInvoiceRepository();
    this.issueInvoiceHandler = new IssueInvoiceHandler(this.repository, deps.sequences, deps.clock, deps.eventPublisher, deps.logger);
    this.recordPaymentHandler = new RecordPaymentHandler(this.repository, deps.sequences, deps.clock, deps.eventPublisher, deps.logger);
  }
}
