import { cleanItemHandlers } from '@/src/shared/crud/clean-item-factory';
import { MODULE_REGISTRATIONS } from '@/src/shared/crud';

const registration = MODULE_REGISTRATIONS.find((x) => x.kind === 'Shift')!;
const { GET, PUT, DELETE } = cleanItemHandlers(registration);

export { GET, PUT, DELETE };
