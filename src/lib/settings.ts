import { verifyPassword } from "@/lib/password";
import { isValidGender } from "@/lib/categories";
import { isValidCurrency, serializeGenders } from "@/lib/storePreferences";

const MAX_LOGO_LENGTH = 2_000_000; // ~1.5MB image as a base64 data URL

export type AccountUpdate = {
  name: string;
  email: string;
  currentPassword?: string;
  newPassword?: string;
};

export function validateAccountInput(
  body: unknown,
  currentPasswordHash: string
): { error: string } | { data: AccountUpdate } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.ownerName === "string" ? b.ownerName.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";

  if (!name) return { error: "Name is required" };
  if (!email || !email.includes("@")) return { error: "A valid email is required" };

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
      name,
      email,
      currentPassword: currentPassword || undefined,
      newPassword: newPassword || undefined,
    },
  };
}

export type BusinessUpdate = {
  businessName: string;
  logoUrl: string | null;
  currency: string;
  taxRatePercent: number;
  defaultGenders: string;
  maintenanceMode: boolean;
};

export function validateBusinessInput(body: unknown): { error: string } | { data: BusinessUpdate } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;
  const businessName = typeof b.businessName === "string" ? b.businessName.trim() : "";
  const logoUrl = typeof b.logoUrl === "string" && b.logoUrl.trim() ? b.logoUrl.trim() : null;

  if (!businessName) return { error: "Business name is required" };
  if (logoUrl && logoUrl.length > MAX_LOGO_LENGTH) {
    return { error: "Logo image is too large" };
  }

  const currency = b.currency;
  if (!isValidCurrency(currency)) {
    return { error: "Select a valid currency" };
  }

  const taxRatePercent = Number(b.taxRatePercent);
  if (!Number.isFinite(taxRatePercent) || taxRatePercent < 0 || taxRatePercent > 100) {
    return { error: "Tax rate must be a number between 0 and 100" };
  }

  const defaultGendersInput = Array.isArray(b.defaultGenders) ? b.defaultGenders : [];
  if (defaultGendersInput.length === 0 || !defaultGendersInput.every(isValidGender)) {
    return { error: "Select at least one default gender category" };
  }

  const maintenanceMode = Boolean(b.maintenanceMode);

  return {
    data: {
      businessName,
      logoUrl,
      currency,
      taxRatePercent,
      defaultGenders: serializeGenders(defaultGendersInput),
      maintenanceMode,
    },
  };
}
