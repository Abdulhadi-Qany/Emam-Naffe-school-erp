import { ApplicationError } from './ApplicationError'

export class NotFoundError extends ApplicationError {
  constructor(resource: string, identifier: string) {
    super(`${resource} not found: ${identifier}`, 'NOT_FOUND', { resource, identifier })
    this.name = 'NotFoundError'
  }
}
