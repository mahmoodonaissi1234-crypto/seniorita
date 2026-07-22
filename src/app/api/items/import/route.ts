import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
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

  const validCount = results.filter((r) => r.status === "valid").length;

  return NextResponse.json({
    results,
    summary: { total: results.length, valid: validCount, invalid: results.length - validCount },
  });
}
