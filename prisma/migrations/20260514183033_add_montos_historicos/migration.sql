-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_Configuracion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "montoMensual" REAL NOT NULL DEFAULT 0,
    "montoHistoricoAntes" REAL NOT NULL DEFAULT 10000,
    "montoHistoricoDesde" REAL NOT NULL DEFAULT 15000,
    "updatedAt" DATETIME NOT NULL
);
INSERT INTO "new_Configuracion" ("id", "montoMensual", "updatedAt") SELECT "id", "montoMensual", "updatedAt" FROM "Configuracion";
DROP TABLE "Configuracion";
ALTER TABLE "new_Configuracion" RENAME TO "Configuracion";
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
