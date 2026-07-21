import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { validateNewUserInput } from "@/lib/users";
import { logActivity } from "@/lib/activityLog";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const users = await prisma.user.findMany({
    select: { id: true, name: true, email: true, role: true, createdAt: true },
    orderBy: { createdAt: "asc" },
  });
  return NextResponse.json(users);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const body = await request.json().catch(() => null);
  const result = validateNewUserInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const existing = await prisma.user.findUnique({ where: { email: result.data.email } });
  if (existing) {
    return NextResponse.json({ error: "That email is already in use" }, { status: 400 });
  }

  const created = await prisma.user.create({
    data: {
      name: result.data.name,
      email: result.data.email,
      passwordHash: hashPassword(result.data.password),
      role: "staff",
    },
    select: { id: true, name: true, email: true, role: true, createdAt: true },
  });

  await logActivity(user, "created", "user", created.id);

  return NextResponse.json(created, { status: 201 });
}
