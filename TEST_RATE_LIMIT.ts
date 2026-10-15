// tests/rate-limit.test.ts
import { describe, it, expect } from "vitest";
import { MemoryRateLimitStore } from "../src/infrastructure/http/rate-limit/memory-store";

describe("MemoryRateLimitStore", () => {
  it("blocks after limit", async () => {
    const s = new MemoryRateLimitStore();
    for (let i = 0; i < 3; i++) {
      const r = await s.hit("k", 1000, 3);
      expect(r.allowed).toBe(true);
    }
    const blocked = await s.hit("k", 1000, 3);
    expect(blocked.allowed).toBe(false);
    expect(blocked.remaining).toBe(0);
  });
  it("isolates keys", async () => {
    const s = new MemoryRateLimitStore();
    await s.hit("a", 1000, 1);
    const r = await s.hit("b", 1000, 1);
    expect(r.allowed).toBe(true);
  });
});