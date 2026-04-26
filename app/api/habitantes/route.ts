import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q      = searchParams.get("q") ?? "";
  const filtro = searchParams.get("filtro") ?? "todos";

  const residentes = await prisma.residente.findMany({
    where: {
      AND: [
        q ? {
          OR: [
            { nombre:   { contains: q } },
            { rut:      { contains: q } },
            { telefono: { contains: q } },
          ],
        } : {},
        filtro === "jefe"         ? { esJefeHogar: true } : {},
        filtro === "dueno"        ? { departamento: { tipoOcupacion: "DUENO" } } : {},
        filtro === "arrendatario" ? { departamento: { tipoOcupacion: "ARRENDATARIO" } } : {},
        filtro === "vehiculo"     ? { vehiculos: { some: {} } } : {},
      ],
    },
    include: {
      departamento: { include: { torre: true } },
      vehiculos: true,
    },
    orderBy: { nombre: "asc" },
  });

  const [total, conJefe, conVehiculo] = await Promise.all([
    prisma.residente.count(),
    prisma.residente.count({ where: { esJefeHogar: true } }),
    prisma.residente.count({ where: { vehiculos: { some: {} } } }),
  ]);

  return NextResponse.json({ residentes, total, conJefe, conVehiculo });
}