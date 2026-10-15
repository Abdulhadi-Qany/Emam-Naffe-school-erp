import type { IIdGenerator } from '@/src/application/ports/input/IIdGenerator'

export class UuidIdGenerator implements IIdGenerator {
  public generate(): string {
    return crypto.randomUUID()
  }
}
