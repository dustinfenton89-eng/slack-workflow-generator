import crypto from "crypto";

export function makeToken(): string {
  return crypto.randomBytes(24).toString("hex");
}
