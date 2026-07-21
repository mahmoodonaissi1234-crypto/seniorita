export type NewUserInput = {
  name: string;
  email: string;
  password: string;
};

export function validateNewUserInput(body: unknown): { error: string } | { data: NewUserInput } {
  if (typeof body !== "object" || body === null) {
    return { error: "Invalid request body" };
  }

  const b = body as Record<string, unknown>;
  const name = typeof b.name === "string" ? b.name.trim() : "";
  const email = typeof b.email === "string" ? b.email.trim() : "";
  const password = typeof b.password === "string" ? b.password : "";

  if (!name) return { error: "Name is required" };
  if (!email || !email.includes("@")) return { error: "A valid email is required" };
  if (password.length < 6) return { error: "Password must be at least 6 characters" };

  return { data: { name, email, password } };
}
