export const ALLOWED_GENDERS = ["men", "women", "unisex"] as const;
export type Gender = (typeof ALLOWED_GENDERS)[number];

export function isValidGender(value: unknown): value is Gender {
  return typeof value === "string" && (ALLOWED_GENDERS as readonly string[]).includes(value);
}

export type CategoryInput = {
  name: string;
  gender: Gender;
  description: string;
};

export function validateCategoryInput(
  body: unknown
): { data: CategoryInput } | { error: string } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }

  const { name, gender, description } = body as Record<string, unknown>;

  if (typeof name !== "string" || name.trim().length === 0) {
    return { error: "name is required" };
  }

  if (!isValidGender(gender)) {
    return { error: `gender must be one of: ${ALLOWED_GENDERS.join(", ")}` };
  }

  if (description !== undefined && typeof description !== "string") {
    return { error: "description must be a string" };
  }

  return {
    data: {
      name: name.trim(),
      gender,
      description: typeof description === "string" ? description : "",
    },
  };
}
