import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q    = searchParams.get("q") ?? "";
  const tipo = searchParams.get("tipo") ?? "todos";

  const vehiculos = await prisma.vehiculo.findMany({
    where: {
      AND: [
        q ? {
          OR: [
            { patente:   { contains: q.toUpperCase() } },
            { residente: { nombre: { contains: q } } },
          ],
        } : {},
        tipo !== "todos" ? { tipo } : {},
      ],
    },
    include: {
      residente: {
        include: {
          departamento: { include: { torre: true } },
        },
      },
    },
    orderBy: { patente: "asc" },
  });

  const [total, autos, motos, camionetas, furgones, otros] = await Promise.all([
    prisma.vehiculo.count(),
    prisma.vehiculo.count({ where: { tipo: "AUTO" } }),
    prisma.vehiculo.count({ where: { tipo: "MOTO" } }),
    prisma.vehiculo.count({ where: { tipo: "CAMIONETA" } }),
    prisma.vehiculo.count({ where: { tipo: "FURGON" } }),
    prisma.vehiculo.count({ where: { tipo: "OTRO" } }),
  ]);

  return NextResponse.json({ vehiculos, stats: { total, autos, motos, camionetas, furgones, otros } });
}