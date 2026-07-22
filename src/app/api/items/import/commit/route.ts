import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { logActivity } from "@/lib/activityLog";
import { notifyLowStock } from "@/lib/notifications";
import { parseCsv } from "@/lib/csv";
import { buildHeaderMap, validateHeader, validateImportRow } from "@/lib/itemsImport";

export async function POST(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user) {
    return NextResponse.json({ error: "Not signed in" }, { status: 401 });
  }

  const body = await request.json().catch(() => null);
  if (typeof body !== "object" || body === null || typeof body.csv !== "string") {
    return NextResponse.json({ error: "csv text is required" }, { status: 400 });
  }

  const rows = parseCsv(body.csv);
  if (rows.length === 0) {
    return NextResponse.json({ error: "CSV file is empty" }, { status: 400 });
  }

  const [headerRow, ...dataRows] = rows;
  const headerError = validateHeader(headerRow);
  if (headerError) {
    return NextResponse.json({ error: headerError }, { status: 400 });
  }
  const headerMap = buildHeaderMap(headerRow);

  const categories = await prisma.category.findMany({ select: { id: true, name: true } });
  const categoryIdsByName = new Map(categories.map((c) => [c.name.toLowerCase(), c.id]));

  const results = dataRows.map((row, index) =>
    validateImportRow(index + 2, row, headerMap, categoryIdsByName)
  );

  const validRows = results.filter((r) => r.status === "valid");
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });

  const created: Array<{ row: number; id: number; name: string }> = [];
  for (const result of validRows) {
    if (result.status !== "valid") continue;
    const item = await prisma.item.create({ data: result.data });
    await logActivity(user, "created", "item", item.id);
    created.push({ row: result.row, id: item.id, name: item.name });

    const threshold = item.lowStockThreshold ?? settings?.lowStockThreshold ?? 5;
    if (item.stock < threshold) {
      notifyLowStock(item.name, item.stock, threshold);
    }
  }

  const invalidCount = results.length - validRows.length;

  return NextResponse.json({
    created,
    summary: { total: results.length, imported: created.length, skipped: invalidCount },
  });
}
