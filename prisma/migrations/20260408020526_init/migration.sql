-- CreateTable
CREATE TABLE "Dueno" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "telefono" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Torre" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "sector" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL
);

-- CreateTable
CREATE TABLE "Departamento" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "numero" TEXT NOT NULL,
    "tipoOcupacion" TEXT NOT NULL DEFAULT 'DUENO',
    "jefeHogar" TEXT,
    "cantHabitantes" INTEGER NOT NULL DEFAULT 0,
    "debeGastoComun" BOOLEAN NOT NULL DEFAULT false,
    "torreId" INTEGER NOT NULL,
    "duenoId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Departamento_torreId_fkey" FOREIGN KEY ("torreId") REFERENCES "Torre" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "Departamento_duenoId_fkey" FOREIGN KEY ("duenoId") REFERENCES "Dueno" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Residente" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "nombre" TEXT NOT NULL,
    "rut" TEXT NOT NULL,
    "telefono" TEXT,
    "tipo" TEXT NOT NULL,
    "departamentoId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Residente_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "Vehiculo" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "patente" TEXT NOT NULL,
    "tipo" TEXT NOT NULL DEFAULT 'AUTO',
    "residenteId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "Vehiculo_residenteId_fkey" FOREIGN KEY ("residenteId") REFERENCES "Residente" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "GastoComun" (
    "id" INTEGER NOT NULL PRIMARY KEY AUTOINCREMENT,
    "monto" REAL NOT NULL,
    "periodo" DATETIME NOT NULL,
    "estadoPago" TEXT NOT NULL DEFAULT 'PENDIENTE',
    "fechaPago" DATETIME,
    "departamentoId" INTEGER NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "GastoComun_departamentoId_fkey" FOREIGN KEY ("departamentoId") REFERENCES "Departamento" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "Dueno_rut_key" ON "Dueno"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "Torre_nombre_key" ON "Torre"("nombre");

-- CreateIndex
CREATE UNIQUE INDEX "Departamento_torreId_numero_key" ON "Departamento"("torreId", "numero");

-- CreateIndex
CREATE UNIQUE INDEX "Residente_rut_key" ON "Residente"("rut");

-- CreateIndex
CREATE UNIQUE INDEX "Vehiculo_patente_key" ON "Vehiculo"("patente");

-- CreateIndex
CREATE UNIQUE INDEX "GastoComun_departamentoId_periodo_key" ON "GastoComun"("departamentoId", "periodo");
