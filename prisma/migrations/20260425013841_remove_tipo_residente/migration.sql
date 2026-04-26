/*
  Warnings:

  - You are about to drop the column `tipo` on the `Residente` table. All the data in the column will be lost.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Residente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "telefono" TEXT,
    "esJefeHogar" BOOLEAN NOT NULL DEFAULT false,
    "departamentoId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Residente_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_Residente" ("createdAt", "departamentoId", "esJefeHogar", "id", "nombre", "rut", "telefono", "updatedAt") SELECT "createdAt", "departamentoId", "esJefeHogar", "id", "nombre", "rut", "telefono", "updatedAt" FROM "Residente";
DROP TABLE "Residente";
ALTER TABLE "new_Residente" RENAME TO "Residente";
CREATE UNIQUE INDEX "Residente_rut_key" ON "Residente"("rut");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
