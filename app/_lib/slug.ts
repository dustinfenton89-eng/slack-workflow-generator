import crypto from "crypto";

const ALPHABET = "23456789abcdefghjkmnpqrstuvwxyzABCDEFGHJKMNPQRSTUVWXYZ";

export function randomSlug(length = 7) {
  const bytes = crypto.randomBytes(length);
  let out = "";
  for (let i = 0; i < length; i++) out += ALPHABET[bytes[i] % ALPHABET.length];
  return out;
}

export function randomToken() {
  return crypto.randomBytes(24).toString("hex");
}

export function hashIp(ip: string) {
  const salt = process.env.SESSION_SECRET || "affiliate-tool";
  return crypto.createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}
