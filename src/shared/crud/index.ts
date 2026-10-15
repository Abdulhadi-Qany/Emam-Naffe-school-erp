export { GenericEntity, GenericCreatedEvent, GenericUpdatedEvent, GenericDeletedEvent } from './GenericEntity';
export { GenericDrizzleRepository, type GenericFilters, type GenericModuleConfig } from './GenericDrizzleRepository';
export {
  CreateGenericHandler, UpdateGenericHandler, ListGenericHandler, toResponse,
  type CreateGenericCommand, type UpdateGenericCommand, type GenericItemResponse,
} from './GenericHandlers';
export { CleanPresenter, type CleanResponse } from './CleanPresenter';
export { GenericModule, buildGenericModules, type ModuleRegistration } from './GenericModule';
export { MODULE_REGISTRATIONS } from './module-registry';
export { MODULE_REGISTRATIONS_A } from './module-registry-a';
export { MODULE_REGISTRATIONS_B } from './module-registry-b';
export { MODULE_REGISTRATIONS_C1 } from './module-registry-c1';
export { MODULE_REGISTRATIONS_C2 } from './module-registry-c2';
export { MODULE_REGISTRATIONS_D1 } from './module-registry-d1';
export { MODULE_REGISTRATIONS_D2 } from './module-registry-d2';
export { MODULE_REGISTRATIONS_D3 } from './module-registry-d3';
export { MODULE_REGISTRATIONS_D4 } from './module-registry-d4';
export { cleanCollectionHandlers, pickName } from './clean-route-factory';
export { cleanItemHandlers } from './clean-item-factory';
