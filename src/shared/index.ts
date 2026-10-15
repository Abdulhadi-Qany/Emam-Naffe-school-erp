/**
 * SHARED KERNEL — public barrel.
 * Import cross-cutting base classes from '@/src/shared'.
 */
export * from './domain/base';
export * from './domain/shared-kernel';
export * from './application/base-handlers';
export { DrizzleSequenceGenerator } from './infrastructure/DrizzleSequenceGenerator';
