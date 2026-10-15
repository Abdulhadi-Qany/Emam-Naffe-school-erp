import type { IIdGenerator } from '@/src/application/ports/input/IIdGenerator'
import type { IClock } from '@/src/application/ports/input/IClock'
import type { IEventPublisher } from '@/src/application/ports/input/IEventPublisher'
import type { ILogger } from '@/src/application/ports/input/ILogger'
import type { DomainEvent } from '@/src/domain/events'
import type { IAdmissionNumberGenerator } from '@/src/domain/services'
import { AdmissionNumber } from '@/src/domain'

let counter = 0
export class FakeIdGenerator implements IIdGenerator {
  generate(): string {
    counter += 1
    return `00000000-0000-4000-8000-${String(counter).padStart(12, '0')}`
  }
}

export class FakeClock implements IClock {
  constructor(private readonly fixed = new Date('2024-03-21T09:00:00Z')) {}
  now(): Date {
    return new Date(this.fixed)
  }
}

export class FakeEventPublisher implements IEventPublisher {
  public readonly published: DomainEvent[] = []
  async publish(event: DomainEvent): Promise<void> {
    this.published.push(event)
  }
  async publishAll(events: DomainEvent[]): Promise<void> {
    this.published.push(...events)
  }
}

export class FakeLogger implements ILogger {
  public readonly lines: string[] = []
  debug(m: string) { this.lines.push('debug:' + m) }
  info(m: string) { this.lines.push('info:' + m) }
  warn(m: string) { this.lines.push('warn:' + m) }
  error(m: string) { this.lines.push('error:' + m) }
}

export class FakeAdmissionNumberGenerator implements IAdmissionNumberGenerator {
  private seq = 0
  async generate(_schoolId: string, year: number, gradeCode: string): Promise<AdmissionNumber> {
    this.seq += 1
    return AdmissionNumber.create(year, gradeCode, this.seq)
  }
}
