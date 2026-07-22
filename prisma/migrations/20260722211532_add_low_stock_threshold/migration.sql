-- AlterTable
ALTER TABLE "Item" ADD COLUMN "lowStockThreshold" INTEGER;

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
    "lowStockThreshold" INTEGER NOT NULL DEFAULT 5,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Settings" ("businessName", "currency", "defaultGenders", "id", "logoUrl", "maintenanceMode", "taxRatePercent", "updatedAt") SELECT "businessName", "currency", "defaultGenders", "id", "logoUrl", "maintenanceMode", "taxRatePercent", "updatedAt" FROM "Settings";
DROP TABLE "Settings";
ALTER TABLE "new_Settings" RENAME TO "Settings";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
