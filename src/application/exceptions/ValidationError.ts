import { ApplicationError } from './ApplicationError'

export class ValidationError extends ApplicationError {
  constructor(message: string, public readonly errors: Record<string, string>) {
    super(message, 'VALIDATION_ERROR', { errors })
    this.name = 'ValidationError'
  }
}
