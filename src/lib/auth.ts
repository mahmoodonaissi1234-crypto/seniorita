import type { NextRequest } from "next/server";
import { prisma } from "@/lib/db";
import { verifyPassword } from "@/lib/password";
import { verifySessionToken } from "@/lib/session";
import type { Role } from "@/lib/roles";

export const SESSION_COOKIE = "seniorita_session";

export type CurrentUser = {
  id: number;
  name: string;
  email: string;
  role: Role;
};

export async function checkCredentials(email: string, password: string) {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user || !verifyPassword(password, user.passwordHash)) return null;
  return user;
}

export async function getCurrentUser(request: NextRequest): Promise<CurrentUser | null> {
  const userId = verifySessionToken(request.cookies.get(SESSION_COOKIE)?.value);
  if (userId === null) return null;

  const user = await prisma.user.findUnique({ where: { id: userId } });
  if (!user) return null;

  return { id: user.id, name: user.name, email: user.email, role: user.role as Role };
}
