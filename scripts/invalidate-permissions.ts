// NEW: scripts/invalidate-permissions.ts
import { permissionService } from "../src/application/auth/permission-service";

const userId = process.argv[2];
if (!userId) {
  console.error("usage: tsx scripts/invalidate-permissions.ts <userId|-->");
  process.exit(1);
}
if (userId === "--all") permissionService.clear();
else permissionService.invalidateUser(userId);
console.log("done");
process.exit(0);