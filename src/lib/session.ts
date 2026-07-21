import { createHmac, timingSafeEqual } from "node:crypto";

// Signs the session cookie's userId so it can't be edited client-side to
// impersonate a different account -- the role itself is never trusted
// from the cookie, only looked up fresh from the User table per request.
const SECRET = process.env.SESSION_SECRET ?? "dev-only-insecure-secret-change-in-production";

function sign(value: string): string {
  return createHmac("sha256", SECRET).update(value).digest("hex");
}

export function createSessionToken(userId: number): string {
  return `${userId}.${sign(String(userId))}`;
}

export function verifySessionToken(token: string | undefined | null): number | null {
  if (!token) return null;

  const [idPart, signature] = token.split(".");
  if (!idPart || !signature) return null;

  const expected = Buffer.from(sign(idPart));
  const given = Buffer.from(signature);
  if (expected.length !== given.length || !timingSafeEqual(expected, given)) return null;

  const userId = Number(idPart);
  return Number.isInteger(userId) && userId > 0 ? userId : null;
}
