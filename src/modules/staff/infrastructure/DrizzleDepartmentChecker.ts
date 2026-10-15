import { db } from '@/lib/db';
import { departments } from '@/lib/db/schema';
import { eq, and } from 'drizzle-orm';
import type { DepartmentChecker } from '@/src/modules/staff/application/HireStaffHandler';

/** Infrastructure adapter: checks department belongs to a school. */
export class DrizzleDepartmentChecker implements DepartmentChecker {
  public async belongsToSchool(departmentId: string, schoolId: string): Promise<boolean> {
    const [row] = await db
      .select({ id: departments.id })
      .from(departments)
      .where(and(eq(departments.id, departmentId), eq(departments.schoolId, schoolId)))
      .limit(1);
    return !!row;
  }
}
