// NEW: src/infrastructure/http/client-ip.ts
export function getClientIp(req: Request): string {
  const trustProxy = process.env.TRUST_PROXY === "true";
  if (trustProxy) {
    const xff = req.headers.get("x-forwarded-for");
    if (xff) {
      const first = xff.split(",")[0]?.trim();
      if (first) return first;
    }
    const real = req.headers.get("x-real-ip");
    if (real) return real.trim();
  }
  // Fallback: hash user-agent + accept-language so at least similar clients share a bucket
  const ua = req.headers.get("user-agent") ?? "";
  const al = req.headers.get("accept-language") ?? "";
  return `anon:${simpleHash(ua + "|" + al)}`;
}

function simpleHash(s: string): string {
  let h = 5381;
  for (let i = 0; i < s.length; i++) h = ((h << 5) + h + s.charCodeAt(i)) | 0;
  return (h >>> 0).toString(36);
}