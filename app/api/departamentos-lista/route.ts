import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q      = searchParams.get("q") ?? "";
  const sector = searchParams.get("sector") ?? "todos";

  // Mes actual para estado de gasto común
  const hoy = new Date();
  const periodoInicio = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth(), 1));
  const periodoFin    = new Date(Date.UTC(hoy.getFullYear(), hoy.getMonth() + 1, 1));
  const sinHabitantes = searchParams.get("sinHabitantes") === "true";
  
  const departamentos = await prisma.departamento.findMany({
    where: {
      AND: [
        q ? { numero: { contains: q } } : {},
        sector !== "todos" ? { torre: { sector } } : {},
        sinHabitantes ? { residentes: { none: {} } } : { residentes: { some: {} } },
      ],
    },
    include: {
      torre: true,
      dueno: { select: { nombre: true } },
      _count: { select: { residentes: true } },
      residentes: {
        select: {
          esJefeHogar: true,
          nombre: true,
          vehiculos: { select: { id: true } },
        },
      },
      gastosComunes: {
        where: { periodo: { gte: periodoInicio, lt: periodoFin } },
        select: { estadoPago: true },
      },
    },
    orderBy: [{ torre: { nombre: "asc" } }, { numero: "asc" }],
  });

  return NextResponse.json({ departamentos });
}