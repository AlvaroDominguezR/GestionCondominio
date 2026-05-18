-- AlterTable
ALTER TABLE "GastoComun" ADD COLUMN "metodoPago" TEXT;

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Ingreso" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "descripcion" TEXT NOT NULL,
    "monto" REAL NOT NULL,
    "fecha" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "metodoPago" TEXT NOT NULL DEFAULT 'TRANSFERENCIA',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Ingreso" ("createdAt", "descripcion", "fecha", "id", "monto", "updatedAt") SELECT "createdAt", "descripcion", "fecha", "id", "monto", "updatedAt" FROM "Ingreso";
DROP TABLE "Ingreso";
ALTER TABLE "new_Ingreso" RENAME TO "Ingreso";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
