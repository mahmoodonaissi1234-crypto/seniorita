export const ALLOWED_CURRENCIES = ["USD", "EUR", "GBP", "CAD", "AUD"] as const;
export type Currency = (typeof ALLOWED_CURRENCIES)[number];

export function isValidCurrency(value: unknown): value is Currency {
  return typeof value === "string" && (ALLOWED_CURRENCIES as readonly string[]).includes(value);
}

export function parseGenders(json: string): string[] {
  try {
    const parsed = JSON.parse(json);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function serializeGenders(genders: string[]): string {
  return JSON.stringify(genders);
}
