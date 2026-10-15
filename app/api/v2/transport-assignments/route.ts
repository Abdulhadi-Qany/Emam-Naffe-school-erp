import { cleanCollectionHandlers } from '@/src/shared/crud/clean-route-factory';
import { MODULE_REGISTRATIONS } from '@/src/shared/crud';

const registration = MODULE_REGISTRATIONS.find((x) => x.kind === 'TransportAssignment')!;
const { GET, POST } = cleanCollectionHandlers(registration);

export { GET, POST };
