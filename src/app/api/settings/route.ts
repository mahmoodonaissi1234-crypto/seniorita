import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getCurrentUser } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { validateAccountInput, validateBusinessInput } from "@/lib/settings";
import { parseGenders } from "@/lib/storePreferences";
import { logActivity } from "@/lib/activityLog";

export async function GET(request: NextRequest) {
  const user = await getCurrentUser(request);
  if (!user || user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const settings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!settings) {
    return NextResponse.json({ error: "Settings not found" }, { status: 404 });
  }

  return NextResponse.json({
    ownerName: user.name,
    email: user.email,
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
  const user = await getCurrentUser(request);
  if (!user || user.role !== "owner") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const currentUserRecord = await prisma.user.findUnique({ where: { id: user.id } });
  const existingSettings = await prisma.settings.findUnique({ where: { id: 1 } });
  if (!currentUserRecord || !existingSettings) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const body = await request.json().catch(() => null);

  const accountResult = validateAccountInput(body, currentUserRecord.passwordHash);
  if ("error" in accountResult) {
    return NextResponse.json({ error: accountResult.error }, { status: 400 });
  }

  const businessResult = validateBusinessInput(body);
  if ("error" in businessResult) {
    return NextResponse.json({ error: businessResult.error }, { status: 400 });
  }

  const { name, email, newPassword } = accountResult.data;

  const emailTaken = await prisma.user.findFirst({
    where: { email, id: { not: user.id } },
  });
  if (emailTaken) {
    return NextResponse.json({ error: "That email is already in use" }, { status: 400 });
  }

  const updatedUser = await prisma.user.update({
    where: { id: user.id },
    data: {
      name,
      email,
      ...(newPassword ? { passwordHash: hashPassword(newPassword) } : {}),
    },
  });

  const updatedSettings = await prisma.settings.update({
    where: { id: 1 },
    data: businessResult.data,
  });

  await logActivity(user, "edited", "settings", updatedSettings.id);

  return NextResponse.json({
    ownerName: updatedUser.name,
    email: updatedUser.email,
    businessName: updatedSettings.businessName,
    logoUrl: updatedSettings.logoUrl,
    currency: updatedSettings.currency,
    taxRatePercent: updatedSettings.taxRatePercent,
    defaultGenders: parseGenders(updatedSettings.defaultGenders),
    maintenanceMode: updatedSettings.maintenanceMode,
    updatedAt: updatedSettings.updatedAt,
  });
}
