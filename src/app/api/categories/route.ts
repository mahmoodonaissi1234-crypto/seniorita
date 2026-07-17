import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateCategoryInput } from "@/lib/categories";

export async function GET() {
  const categories = await prisma.category.findMany({
    include: { _count: { select: { items: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json(categories);
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const result = validateCategoryInput(body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const category = await prisma.category.create({ data: result.data });
  return NextResponse.json(category, { status: 201 });
}
