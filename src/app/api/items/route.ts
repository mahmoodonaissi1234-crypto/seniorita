import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateItemInput } from "@/lib/items";
import { logActivity } from "@/lib/activityLog";
import { notifyLowStock } from "@/lib/notifications";
import { toCsv } from "@/lib/csv";
import { CSV_COLUMNS } from "@/lib/itemsImport";
import type { Prisma } from "@/generated/prisma/client";

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const category = searchParams.get("category");
  const gender = searchParams.get("gender");
  const type = searchParams.get("type");
  const search = searchParams.get("search");

  const where: Prisma.ItemWhereInput = {};

  if (category) {
    const categoryId = Number(category);
    if (Number.isInteger(categoryId)) {
      where.categoryId = categoryId;
    }
  }
  if (gender) where.gender = gender;
  if (type) where.type = type;
  if (search) where.name = { contains: search };

  const items = await prisma.item.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });

  if (searchParams.get("format") === "csv") {
    const rows = items.map((item) => [
      item.name,
      item.category.name,
      item.gender,
      item.type,
      String(item.price),
      item.material,
      item.natureTheme,
      item.description,
      String(item.stock),
      String(item.isActive),
      item.lowStockThreshold === null ? "" : String(item.lowStockThreshold),
    ]);
    const csv = toCsv([...CSV_COLUMNS], rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": 'attachment; filename="items-export.csv"',
      },
    });
  }

  return NextResponse.json(items);
}

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  const result = validateItemInput(body);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const category = await prisma.category.findUnique({
    where: { id: result.data.categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  const item = await prisma.item.create({
    data: result.data,
    include: { category: true },
  });
  await logActivity(user, "created", "item", item.id);

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  const threshold = item.lowStockThreshold ?? settings?.lowStockThreshold ?? 5;
  if (item.stock < threshold) {
    notifyLowStock(item.name, item.stock, threshold);
  }

  return NextResponse.json(item, { status: 201 });
}
