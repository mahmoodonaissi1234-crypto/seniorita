/*
  Warnings:

  - You are about to drop the column `email` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `ownerName` on the `Settings` table. All the data in the column will be lost.
  - You are about to drop the column `passwordHash` on the `Settings` table. All the data in the column will be lost.

*/
-- CreateTable
CREATE TABLE "User" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "passwordHash" TEXT NOT NULL,
    "role" TEXT NOT NULL DEFAULT 'staff',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Settings" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT DEFAULT 1,
    "businessName" TEXT NOT NULL,
    "logoUrl" TEXT,
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "taxRatePercent" REAL NOT NULL DEFAULT 0,
    "defaultGenders" TEXT NOT NULL DEFAULT '["men","women","unisex"]',
    "maintenanceMode" BOOLEAN NOT NULL DEFAULT false,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("businessName", "currency", "defaultGenders", "id", "logoUrl", "maintenanceMode", "taxRatePercent", "updatedAt") SELECT "businessName", "currency", "defaultGenders", "id", "logoUrl", "maintenanceMode", "taxRatePercent", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");
