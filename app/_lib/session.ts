const encoder = new TextEncoder();

async function getKey(secret: string) {
  return crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
}

function toHex(buf: ArrayBuffer) {
  return Array.from(new Uint8Array(buf))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
}

export function timingSafeEqual(a: string, b: string) {
  if (a.length !== b.length) return false;
  let result = 0;
  for (let i = 0; i < a.length; i++) result |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return result === 0;
}

const SESSION_TTL_MS = 1000 * 60 * 60 * 24 * 7; // 7 days

export async function createSessionToken(secret: string) {
  const expires = Date.now() + SESSION_TTL_MS;
  const key = await getKey(secret);
  const sig = toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(String(expires))));
  return `${expires}.${sig}`;
}

export async function verifySessionToken(token: string | undefined, secret: string) {
  if (!token || !secret) return false;
  const [payload, sig] = token.split(".");
  if (!payload || !sig) return false;
  const expires = Number(payload);
  if (!Number.isFinite(expires) || Date.now() > expires) return false;
  const key = await getKey(secret);
  const expectedSig = toHex(await crypto.subtle.sign("HMAC", key, encoder.encode(payload)));
  return timingSafeEqual(sig, expectedSig);
}
