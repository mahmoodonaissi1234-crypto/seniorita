import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/settings";

export const SESSION_COOKIE = "seniorita_session";

export async function checkCredentials(email: string, password: string) {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) return false;
  return email === settings.email && verifyPassword(password, settings.passwordHash);
}
