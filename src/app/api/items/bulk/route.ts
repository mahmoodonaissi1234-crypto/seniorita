import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { isValidBulkAction } from "@/lib/items";
import { logActivity } from "@/lib/activityLog";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null) {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }
  const { ids, action, categoryId } = body as Record<string, unknown>;

  if (!Array.isArray(ids) || ids.length === 0 || !ids.every((id) => Number.isInteger(id) && id > 0)) {
    return NextResponse.json({ error: "ids must be a non-empty array of item ids" }, { status: 400 });
  }
  if (!isValidBulkAction(action)) {
    return NextResponse.json({ error: "Invalid bulk action" }, { status: 400 });
  }

  let targetCategoryId: number | null = null;
  if (action === "changeCategory") {
    targetCategoryId = Number(categoryId);
    if (!Number.isInteger(targetCategoryId) || targetCategoryId <= 0) {
      return NextResponse.json({ error: "categoryId is required for changeCategory" }, { status: 400 });
    }
    const category = await prisma.category.findUnique({ where: { id: targetCategoryId } });
    if (!category) {
      return NextResponse.json({ error: "Category not found" }, { status: 400 });
    }
  }

  const uniqueIds = [...new Set(ids as number[])];
  const succeeded: number[] = [];
  const failed: Array<{ id: number; error: string }> = [];

  for (const id of uniqueIds) {
    const existing = await prisma.item.findUnique({ where: { id } });
    if (!existing) {
      failed.push({ id, error: "Item not found" });
      continue;
    }

    if (action === "delete") {
      await prisma.item.delete({ where: { id } });
      await logActivity(user, "deleted", "item", id);
    } else {
      const data =
        action === "activate"
          ? { isActive: true }
          : action === "deactivate"
            ? { isActive: false }
            : { categoryId: targetCategoryId as number };
      await prisma.item.update({ where: { id }, data });
      await logActivity(user, "edited", "item", id);
    }
    succeeded.push(id);
  }

  return NextResponse.json({ succeeded, failed });
}
