-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Departamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "tipoOcupacion" TEXT NOT NULL DEFAULT 'DUENO',
    "jefeHogar" TEXT,
    "cantHabitantes" INTEGER NOT NULL DEFAULT 0,
    "debeGastoComun" BOOLEAN NOT NULL DEFAULT false,
    "torreId" INTEGER NOT NULL,
    "duenoId" INTEGER,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Departamento_torreId_fkey" FOREIGN KEY ("torreId") REFERENCES "Torre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Departamento_duenoId_fkey" FOREIGN KEY ("duenoId") REFERENCES "Dueno" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_Departamento" ("cantHabitantes", "createdAt", "debeGastoComun", "duenoId", "id", "jefeHogar", "numero", "tipoOcupacion", "torreId", "updatedAt") SELECT "cantHabitantes", "createdAt", "debeGastoComun", "duenoId", "id", "jefeHogar", "numero", "tipoOcupacion", "torreId", "updatedAt" FROM "Departamento";
DROP TABLE "Departamento";
ALTER TABLE "new_Departamento" RENAME TO "Departamento";
CREATE UNIQUE INDEX "Departamento_torreId_numero_key" ON "Departamento"("torreId", "numero");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
