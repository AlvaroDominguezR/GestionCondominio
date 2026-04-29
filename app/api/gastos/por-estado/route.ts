import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const estado = searchParams.get("estado") ?? "";
  const mes    = searchParams.get("mes") ?? "";

  if (!estado || !mes) {
    return NextResponse.json({ gastos: [] });
  }

  const [year, month] = mes.split("-").map(Number);
  const periodoInicio = new Date(year, month - 1, 1);
  const periodoFin    = new Date(year, month, 1);

  const gastos = await prisma.gastoComun.findMany({
    where: {
      estadoPago: estado,
      periodo: { gte: periodoInicio, lt: periodoFin },
    },
    include: {
      departamento: {
        include: {
          torre: true,
          dueno: true,
        },
      },
    },
    orderBy: [
      { departamento: { torre: { nombre: "asc" } } },
      { departamento: { numero: "asc" } },
    ],
  });

  // Para atrasados, contar cuántos meses consecutivos sin pagar
  const gastosConMeses = await Promise.all(
    gastos.map(async (g) => {
      const mesesAtrasados = await prisma.gastoComun.count({
        where: {
          departamentoId: g.departamentoId,
          estadoPago: { in: ["PENDIENTE", "ATRASADO"] },
        },
      });
      return { ...g, mesesAtrasados };
    })
  );

  return NextResponse.json({ gastos: gastosConMeses });
}