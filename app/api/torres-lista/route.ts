import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const torres = await prisma.torre.findMany({
    orderBy: [{ sector: "asc" }, { nombre: "asc" }],
    include: {
      _count: { select: { departamentos: true } },
      departamentos: {
        select: {
          _count: { select: { residentes: true } },
        },
      },
    },
  });

  const torresConOcupados = torres.map((t) => ({
    id:     t.id,
    nombre: t.nombre,
    sector: t.sector,
    _count: t._count,
    departamentosOcupados: t.departamentos.filter((d) => d._count.residentes > 0).length,
  }));

  return NextResponse.json({ torres: torresConOcupados });
}