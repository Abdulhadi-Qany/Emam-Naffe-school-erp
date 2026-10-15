import type { ISequenceGenerator } from '@/src/shared/domain/shared-kernel';
import { nextInSequence, peekSequence } from '@/lib/api/sequence';

/** Infrastructure adapter: ISequenceGenerator -> number_sequences table. */
export class DrizzleSequenceGenerator implements ISequenceGenerator {
  public async next(key: string, schoolId: string): Promise<number> {
    return nextInSequence(key, schoolId);
  }

  public async peek(key: string, schoolId: string): Promise<number> {
    return peekSequence(key, schoolId);
  }
}
