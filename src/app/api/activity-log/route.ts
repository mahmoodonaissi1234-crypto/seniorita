import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const { searchParams } = request.nextUrl;
  const userId = searchParams.get("userId");
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.ActivityLogWhereInput = {};

  if (userId) {
    const id = Number(userId);
    if (Number.isInteger(id)) where.userId = id;
  }

  if (from || to) {
    const timestamp: Prisma.DateTimeFilter = {};
    if (from) timestamp.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      timestamp.lte = toDate;
    }
    where.timestamp = timestamp;
  }

  const entries = await prisma.activityLog.findMany({
    where,
    orderBy: { timestamp: "desc" },
  });

  return NextResponse.json(entries);
}
