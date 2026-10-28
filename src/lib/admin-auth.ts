import { createHmac, timingSafeEqual } from "node:crypto";

export const ADMIN_SESSION_COOKIE = "marina_admin_session";
const SESSION_DURATION_SECONDS = 60 * 60 * 8;

function sessionSecret() {
  const secret = process.env.ADMIN_SESSION_SECRET;
  return secret && secret.length >= 32 ? secret : null;
}

function signature(payload: string, secret: string) {
  return createHmac("sha256", secret).update(payload).digest("base64url");
}

export function createAdminSession() {
  const secret = sessionSecret();
  if (!secret) {
    throw new Error("ADMIN_SESSION_SECRET ausente ou demasiado curto.");
  }
  const expiresAt = Math.floor(Date.now() / 1000) + SESSION_DURATION_SECONDS;
  const payload = String(expiresAt);
  return {
    token: `${payload}.${signature(payload, secret)}`,
    maxAge: SESSION_DURATION_SECONDS,
  };
}

export function isValidAdminSession(token: string | undefined) {
  const secret = sessionSecret();
  if (!secret || !token) return false;
  const [expiresAt, suppliedSignature, extra] = token.split(".");
  if (!expiresAt || !suppliedSignature || extra || !/^\d+$/.test(expiresAt)) {
    return false;
  }
  if (Number(expiresAt) <= Math.floor(Date.now() / 1000)) return false;

  const expected = Buffer.from(signature(expiresAt, secret));
  const supplied = Buffer.from(suppliedSignature);
  return (
    expected.length === supplied.length && timingSafeEqual(expected, supplied)
  );
}

export function verifyAdminPassword(password: string) {
  const expectedPassword = process.env.ADMIN_PASSWORD;
  if (!expectedPassword) return false;
  const expected = Buffer.from(expectedPassword);
  const supplied = Buffer.from(password);
  return expected.length === supplied.length && timingSafeEqual(expected, supplied);
}
