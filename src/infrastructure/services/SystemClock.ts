import type { IClock } from '@/src/application/ports/input/IClock'

export class SystemClock implements IClock {
  public now(): Date {
    return new Date()
  }
}
