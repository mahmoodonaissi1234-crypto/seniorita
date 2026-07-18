import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: Prisma.TransactionWhereInput = {};

  if (from || to) {
    const date: Prisma.DateTimeFilter = {};
    if (from) date.gte = new Date(from);
    if (to) {
      const toDate = new Date(to);
      toDate.setHours(23, 59, 59, 999);
      date.lte = toDate;
    }
    where.date = date;
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "asc" },
  });

  return NextResponse.json(transactions);
}
