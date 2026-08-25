import { createHmac, timingSafeEqual } from "crypto";
import { deflateRawSync, inflateRawSync } from "zlib";
import type { Notice, TokenPayload } from "./types";

const FALLBACK_SECRET = "raisenotice-demo-secret-not-for-production";

export function getSecret(): string {
  return process.env.NOTICE_SECRET || FALLBACK_SECRET;
}

export function signPayload(payload: TokenPayload): string {
  const json = Buffer.from(JSON.stringify(payload), "utf8");
  const body = deflateRawSync(json).toString("base64url");
  const sig = hmac(body);
  return `${body}.${sig}`;
}

export function signPaidNotice(notice: Notice): string {
  const now = Math.floor(Date.now() / 1000);
  return signPayload({ n: notice, paid: true, iat: now, paidAt: now });
}

export function signPendingNotice(notice: Notice): string {
  const now = Math.floor(Date.now() / 1000);
  return signPayload({ n: notice, paid: false, iat: now });
}

export type VerifyResult =
  | { ok: true; payload: TokenPayload }
  | { ok: false; error: string };

export function verifyToken(token: string): VerifyResult {
  if (!token || token.length > 12000) {
    return { ok: false, error: "This notice link is invalid." };
  }
  const parts = token.split(".");
  if (parts.length !== 2 || !parts[0] || !parts[1]) {
    return { ok: false, error: "This notice link is invalid." };
  }
  const [body, sig] = parts;
  const expected = hmac(body);
  if (!safeEqual(sig, expected)) {
    return { ok: false, error: "This notice link is invalid." };
  }
  try {
    const json = inflateRawSync(Buffer.from(body, "base64url")).toString("utf8");
    const payload = JSON.parse(json) as TokenPayload;
    if (!payload || typeof payload !== "object" || !payload.n) {
      return { ok: false, error: "This notice link is invalid." };
    }
    return { ok: true, payload };
  } catch {
    return { ok: false, error: "This notice link is invalid." };
  }
}

function hmac(body: string): string {
  return createHmac("sha256", getSecret())
    .update(body)
    .digest("base64url")
    .slice(0, 22);
}

function safeEqual(a: string, b: string): boolean {
  const ba = Buffer.from(a);
  const bb = Buffer.from(b);
  if (ba.length !== bb.length) return false;
  return timingSafeEqual(ba, bb);
}
