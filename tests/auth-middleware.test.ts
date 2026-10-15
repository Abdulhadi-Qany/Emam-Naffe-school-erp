// tests/auth-middleware.test.ts
import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/src/application/auth/permission-service", () => ({
  permissionService: { resolve: vi.fn() },
}));
vi.mock("@/src/infrastructure/auth/server", () => ({
  getSession: vi.fn(),
}));

import { withAuth } from "../src/infrastructure/http/middleware/auth";
import { permissionService } from "@/src/application/auth/permission-service";
import { getSession } from "@/src/infrastructure/auth/server";

const mkReq = () => new Request("http://x/api/students") as any;

describe("withAuth — SEC-001 regression", () => {
  beforeEach(() => vi.resetAllMocks());

  it("does NOT auto-create a role for a user with no roles", async () => {
    (getSession as any).mockResolvedValue({ user: { id: "u1" }, session: {} });
    (permissionService.resolve as any).mockResolvedValue({
      userId: "u1", schoolId: null, roles: [], permissions: [], resolvedAt: Date.now(),
    });

    const handler = withAuth(async () => Response.json({ ok: true }));
    const res = await handler(mkReq(), { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
    // Critical: permission service was never asked to create anything.
    expect(permissionService.resolve).toHaveBeenCalledWith("u1", null);
  });

  it("403s when role exists but permissions are empty", async () => {
    (getSession as any).mockResolvedValue({ user: { id: "u1" }, session: {} });
    (permissionService.resolve as any).mockResolvedValue({
      userId: "u1", schoolId: null, roles: ["teacher"], permissions: [], resolvedAt: Date.now(),
    });
    const handler = withAuth(async () => Response.json({ ok: true }));
    const res = await handler(mkReq(), { params: Promise.resolve({}) });
    expect(res.status).toBe(403);
  });

  it("401s unauthenticated", async () => {
    (getSession as any).mockResolvedValue(null);
    const handler = withAuth(async () => Response.json({ ok: true }));
    const res = await handler(mkReq(), { params: Promise.resolve({}) });
    expect(res.status).toBe(401);
  });

  it("500s and fails closed on resolve error", async () => {
    (getSession as any).mockResolvedValue({ user: { id: "u1" }, session: {} });
    (permissionService.resolve as any).mockRejectedValue(new Error("parse"));
    const handler = withAuth(async () => Response.json({ ok: true }));
    const res = await handler(mkReq(), { params: Promise.resolve({}) });
    expect(res.status).toBe(500);
  });
});