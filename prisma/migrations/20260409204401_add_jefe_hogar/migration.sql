-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Residente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "telefono" TEXT,
    "tipo" TEXT NOT NULL,
    "esJefeHogar" BOOLEAN NOT NULL DEFAULT false,
    "departamentoId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Residente_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Residente" ("createdAt", "departamentoId", "id", "nombre", "rut", "telefono", "tipo", "updatedAt") SELECT "createdAt", "departamentoId", "id", "nombre", "rut", "telefono", "tipo", "updatedAt" FROM "Residente";
DROP TABLE "Residente";
ALTER TABLE "new_Residente" RENAME TO "Residente";
CREATE UNIQUE INDEX "Residente_rut_key" ON "Residente"("rut");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
