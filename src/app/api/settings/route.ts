import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { hashPassword, validateSettingsInput } from "@/lib/settings";
import { parseGenders } from "@/lib/storePreferences";

export async function GET() {
  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  return NextResponse.json({
    id: settings.id,
    ownerName: settings.ownerName,
    email: settings.email,
    businessName: settings.businessName,
    logoUrl: settings.logoUrl,
    currency: settings.currency,
    taxRatePercent: settings.taxRatePercent,
    defaultGenders: parseGenders(settings.defaultGenders),
    maintenanceMode: settings.maintenanceMode,
    updatedAt: settings.updatedAt,
  });
}

export async function PUT(request: NextRequest) {
  const existing = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!existing) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);
  const result = validateSettingsInput(body, existing.passwordHash);

  if ("error" in result) {
    return NextResponse.json({ error: result.error }, { status: 400 });
  }

  const {
    ownerName,
    email,
    businessName,
    logoUrl,
    currency,
    taxRatePercent,
    defaultGenders,
    maintenanceMode,
    newPassword,
  } = result.data;

  const updated = await prisma.settings.update({
    where: { id: 1 },
    data: {
      ownerName,
      email,
      businessName,
      logoUrl,
      currency,
      taxRatePercent,
      defaultGenders,
      maintenanceMode,
      ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
    },
  });

  return NextResponse.json({
    id: updated.id,
    ownerName: updated.ownerName,
    email: updated.email,
    businessName: updated.businessName,
    logoUrl: updated.logoUrl,
    currency: updated.currency,
    taxRatePercent: updated.taxRatePercent,
    defaultGenders: parseGenders(updated.defaultGenders),
    maintenanceMode: updated.maintenanceMode,
    updatedAt: updated.updatedAt,
  });
}
