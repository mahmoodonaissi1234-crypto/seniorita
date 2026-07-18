import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { validateItemInput } from "@/lib/items";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
  }

  const item = await prisma.item.findUnique({
    where: { id },
    include: { category: true },
  });
  if (!item) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  return NextResponse.json(item);
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const result = validateItemInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  const category = await prisma.category.findUnique({
    where: { id: result.data.categoryId },
  });
  if (!category) {
    return NextResponse.json({ error: "Category not found" }, { status: 400 });
  }

  const item = await prisma.item.update({
    where: { id },
    data: result.data,
    include: { category: true },
  });
  return NextResponse.json(item);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid item id" }, { status: 400 });
  }

  const existing = await prisma.item.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Item not found" }, { status: 404 });
  }

  await prisma.item.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}
