import { randomBytes, scryptSync, timingSafeEqual } from "node:crypto";

const KEY_LENGTH = 64;
const MAX_LOGO_LENGTH = 2_000_000; // ~1.5MB image as a base64 data URL

export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const derived = scryptSync(password, salt, KEY_LENGTH).toString("hex");
  return `${salt}:${derived}`;
}

export function verifyPassword(password: string, storedHash: string): boolean {
  const [salt, hash] = storedHash.split(":");
  if (!salt || !hash) return false;

  const derived = scryptSync(password, salt, KEY_LENGTH);
  const stored = Buffer.from(hash, "hex");
  return derived.length === stored.length && timingSafeEqual(derived, stored);
}

export type SettingsUpdate = {
  ownerName: string;
  email: string;
  businessName: string;
  logoUrl: string | null;
  currentPassword?: string;
  newPassword?: string;
};

export function validateSettingsInput(
  body: unknown,
  currentPasswordHash: string
): { error: string } | { data: SettingsUpdate } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;
  const ownerName = typeof b.ownerName === "string" ? b.ownerName.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const businessName = typeof b.businessName === "string" ? b.businessName.trim() : "";
  const logoUrl = typeof b.logoUrl === "string" && b.logoUrl.trim() ? b.logoUrl.trim() : null;

  if (!ownerName) return { error: "Name is required" };
  if (!email || !email.includes("@")) return { error: "A valid email is required" };
  if (!businessName) return { error: "Business name is required" };
  if (logoUrl && logoUrl.length > MAX_LOGO_LENGTH) {
    return { error: "Logo image is too large" };
  }

  const newPassword = typeof b.newPassword === "string" ? b.newPassword : "";
  const currentPassword = typeof b.currentPassword === "string" ? b.currentPassword : "";

  if (newPassword) {
    if (newPassword.length < 6) {
      return { error: "New password must be at least 6 characters" };
    }
    if (!currentPassword) {
      return { error: "Current password is required to set a new password" };
    }
    if (!verifyPassword(currentPassword, currentPasswordHash)) {
      return { error: "Current password is incorrect" };
    }
  }

  return {
    data: {
      ownerName,
      email,
      businessName,
      logoUrl,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    },
  };
}
