export const ALLOWED_ROLES = ["owner", "staff"] as const;
export type Role = (typeof ALLOWED_ROLES)[number];

export function isValidRole(value: unknown): value is Role {
  return typeof value === "string" && (ALLOWED_ROLES as readonly string[]).includes(value);
}
