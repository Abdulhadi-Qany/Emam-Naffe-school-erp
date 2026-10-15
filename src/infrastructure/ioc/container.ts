import type { IStudentRepository } from '@/src/domain/repositories'
import type { IIdGenerator } from '@/src/application/ports/input/IIdGenerator'
import type { IClock } from '@/src/application/ports/input/IClock'
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher'
import type { ILogger } from '@/src/application/ports/input/ILogger'
import type { IAdmissionNumberGenerator } from '@/src/domain/services'
import { AdmitStudentHandler } from '@/src/application/use-cases/commands/admit-student/AdmitStudentHandler'
import { UpdateStudentHandler } from '@/src/application/use-cases/commands/update-student/UpdateStudentHandler'
import { PromoteStudentHandler } from '@/src/application/use-cases/commands/promote-student/PromoteStudentHandler'
import { TransferStudentHandler } from '@/src/application/use-cases/commands/transfer-student/TransferStudentHandler'
import { DropoutStudentHandler } from '@/src/application/use-cases/commands/dropout-student/DropoutStudentHandler'
import { GetStudentHandler } from '@/src/application/use-cases/queries/get-student/GetStudentHandler'
import { ListStudentsHandler } from '@/src/application/use-cases/queries/list-students/ListStudentsHandler'
import { SearchStudentsHandler } from '@/src/application/use-cases/queries/search-students/SearchStudentsHandler'
import { DrizzleStudentRepository } from '../persistence/drizzle/DrizzleStudentRepository'
import {
  UuidIdGenerator,
  SystemClock,
  ConsoleLogger,
  InMemoryEventPublisher,
  DrizzleAdmissionNumberGenerator,
  ConsoleNotificationService,
  LocalFileStorage,
} from '../services'

/**
 * Composition root. Wires ports (interfaces) to their infrastructure
 * implementations. Swap any adapter here without touching use cases or domain.
 */
export class Container {
  // Infrastructure services
  public readonly logger: ILogger
  public readonly idGenerator: IIdGenerator
  public readonly clock: IClock
  public readonly eventPublisher: InMemoryEventPublisher
  public readonly notificationService: ConsoleNotificationService
  public readonly fileStorage: LocalFileStorage

  // Repositories (ports → implementations)
  public readonly studentRepository: IStudentRepository
  private readonly admissionNumberGenerator: IAdmissionNumberGenerator

  // Use cases
  public readonly admitStudentHandler: AdmitStudentHandler
  public readonly updateStudentHandler: UpdateStudentHandler
  public readonly promoteStudentHandler: PromoteStudentHandler
  public readonly transferStudentHandler: TransferStudentHandler
  public readonly dropoutStudentHandler: DropoutStudentHandler
  public readonly getStudentHandler: GetStudentHandler
  public readonly listStudentsHandler: ListStudentsHandler
  public readonly searchStudentsHandler: SearchStudentsHandler

  constructor() {
    this.logger = new ConsoleLogger('EBPS')
    this.idGenerator = new UuidIdGenerator()
    this.clock = new SystemClock()
    this.eventPublisher = new InMemoryEventPublisher(this.logger)
    this.notificationService = new ConsoleNotificationService(this.logger)
    this.fileStorage = new LocalFileStorage()

    this.studentRepository = new DrizzleStudentRepository()
    this.admissionNumberGenerator = new DrizzleAdmissionNumberGenerator(this.studentRepository)

    this.admitStudentHandler = new AdmitStudentHandler(
      this.studentRepository,
      this.admissionNumberGenerator,
      this.idGenerator,
      this.clock,
      this.eventPublisher,
      this.logger
    )

    this.getStudentHandler = new GetStudentHandler(this.studentRepository)
    this.listStudentsHandler = new ListStudentsHandler(this.studentRepository)
    this.searchStudentsHandler = new SearchStudentsHandler(this.studentRepository)

    this.updateStudentHandler = new UpdateStudentHandler(
      this.studentRepository,
      this.eventPublisher,
      this.logger
    )
    this.promoteStudentHandler = new PromoteStudentHandler(
      this.studentRepository,
      this.eventPublisher,
      this.logger
    )
    this.transferStudentHandler = new TransferStudentHandler(
      this.studentRepository,
      this.eventPublisher,
      this.logger
    )
    this.dropoutStudentHandler = new DropoutStudentHandler(
      this.studentRepository,
      this.eventPublisher,
      this.logger
    )
  }
}

let singleton: Container | null = null

/** Lazily-created application-wide container. */
export function getContainer(): Container {
  if (!singleton) singleton = new Container()
  return singleton
}
