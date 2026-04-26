-- CreateTable
CREATE TABLE "Configuracion" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "montoMensual" REAL NOT NULL DEFAULT 0,
    "updatedAt" DATETIME NOT NULL
);
