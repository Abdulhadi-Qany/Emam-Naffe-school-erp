/**
 * DOMAIN LAYER — Errors
 * Pure business-rule violations. No framework, no HTTP, no DB knowledge.
 */

export class DomainError extends Error {
  public readonly code: string
  public readonly details?: Record<string, unknown>

  constructor(message: string, code = 'DOMAIN_ERROR', details?: Record<string, unknown>) {
    super(message)
    this.name = 'DomainError'
    this.code = code
    this.details = details
    // NOTE: never reset the prototype here — Object.setPrototypeOf(this, DomainError.prototype)
    // would downgrade subclass instances (e.g. StudentNotFoundError) and break
    // `instanceof` checks in presenters. Target is ES2022, so class extends Error works natively.
  }
}
