import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { validateCategoryInput } from "@/lib/categories";
import { logActivity } from "@/lib/activityLog";

function parseId(idParam: string): number | null {
  const id = Number(idParam);
  return Number.isInteger(id) && id > 0 ? id : null;
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const body = await request.json().catch(() => null);
  const result = validateCategoryInput(body);
  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  const category = await prisma.category.update({ where: { id }, data: result.data });
  await logActivity(user, "edited", "category", category.id);
  return NextResponse.json(category);
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const { id: idParam } = await params;
  const id = parseId(idParam);
  if (id === null) {
    return NextResponse.json({ error: "Invalid category id" }, { status: 400 });
  }

  const existing = await prisma.category.findUnique({
    where: { id },
    include: { _count: { select: { items: true } } },
  });
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (existing._count.items > 0) {
    return NextResponse.json(
      {
        error: `Cannot delete "${existing.name}": ${existing._count.items} item(s) are still assigned to it. Reassign or delete those items first.`,
      },
      { status: 409 }
    );
  }

  await prisma.category.delete({ where: { id } });
  await logActivity(user, "deleted", "category", id);
  return NextResponse.json({ ok: true });
}
