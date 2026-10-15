// tests/permissions.test.ts
import { describe, it, expect } from "vitest";
import {
  hasPermission, hasAnyPermission, hasAllPermissions,
  parsePermissions, PermissionParseError, PERMISSIONS,
} from "../src/domain/auth/permissions";

describe("parsePermissions", () => {
  it("accepts known permissions", () => {
    expect(parsePermissions(["students:read"])).toEqual(["students:read"]);
  });
  it("accepts json string", () => {
    expect(parsePermissions('["students:read","finance:write"]'))
      .toEqual(["students:read", "finance:write"]);
  });
  it("rejects unknown permissions", () => {
    expect(() => parsePermissions(["drop_table:all"])).toThrow(PermissionParseError);
  });
  it("rejects SQL-looking strings", () => {
    expect(() => parsePermissions(["students:read'; DROP TABLE users;--"]))
      .toThrow(PermissionParseError);
  });
  it("rejects oversized payloads", () => {
    expect(() => parsePermissions("x".repeat(5000))).toThrow(PermissionParseError);
  });
  it("rejects non-array json", () => {
    expect(() => parsePermissions('{"a":1}')).toThrow(PermissionParseError);
  });
  it("dedupes", () => {
    expect(parsePermissions(["students:read","students:read"]))
      .toEqual(["students:read"]);
  });
});

describe("hasPermission", () => {
  it("wildcard grants everything", () => {
    expect(hasPermission([PERMISSIONS.WILDCARD], PERMISSIONS.FINANCE_WRITE)).toBe(true);
  });
  it("resource:* grants resource actions", () => {
    expect(hasPermission(["students:*" as any], PERMISSIONS.STUDENTS_WRITE)).toBe(true);
  });
  it("empty grants deny", () => {
    expect(hasPermission([], PERMISSIONS.STUDENTS_READ)).toBe(false);
  });
});

describe("hasAny/All", () => {
  const g = [PERMISSIONS.STUDENTS_READ, PERMISSIONS.FINANCE_READ] as const;
  it("any", () => {
    expect(hasAnyPermission(g, [PERMISSIONS.ADMIN_MANAGE, PERMISSIONS.FINANCE_READ])).toBe(true);
  });
  it("all", () => {
    expect(hasAllPermissions(g, [PERMISSIONS.STUDENTS_READ, PERMISSIONS.FINANCE_READ])).toBe(true);
    expect(hasAllPermissions(g, [PERMISSIONS.STUDENTS_READ, PERMISSIONS.ADMIN_MANAGE])).toBe(false);
  });
});