import { MODULE_REGISTRATIONS_A } from './module-registry-a';
import { MODULE_REGISTRATIONS_B } from './module-registry-b';
import { MODULE_REGISTRATIONS_C1 } from './module-registry-c1';
import { MODULE_REGISTRATIONS_C2 } from './module-registry-c2';
import { MODULE_REGISTRATIONS_D1 } from './module-registry-d1';
import { MODULE_REGISTRATIONS_D2 } from './module-registry-d2';
import { MODULE_REGISTRATIONS_D3 } from './module-registry-d3';
import { MODULE_REGISTRATIONS_D4 } from './module-registry-d4';
import type { ModuleRegistration } from './GenericModule';

/** COMPLETE REGISTRY — 24+26+16+17+9+16+12+12 = 132 Clean modules + Student/Staff/Invoice. */
export const MODULE_REGISTRATIONS: ModuleRegistration[] = [
  ...MODULE_REGISTRATIONS_A,
  ...MODULE_REGISTRATIONS_B,
  ...MODULE_REGISTRATIONS_C1,
  ...MODULE_REGISTRATIONS_C2,
  ...MODULE_REGISTRATIONS_D1,
  ...MODULE_REGISTRATIONS_D2,
  ...MODULE_REGISTRATIONS_D3,
  ...MODULE_REGISTRATIONS_D4,
];
