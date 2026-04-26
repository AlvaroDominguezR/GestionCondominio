import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const torres = await prisma.torre.findMany({
    orderBy: { nombre: "asc" },
    include: {
      departamentos: {
        where: { residentes: { some: {} } },
        orderBy: { numero: "asc" },
        select: { id: true, numero: true },
      },
    },
  });

  // Solo torres que tienen deptos ocupados
  const torresConDeptos = torres.filter((t) => t.departamentos.length > 0);

  return NextResponse.json({ torres: torresConDeptos });
}