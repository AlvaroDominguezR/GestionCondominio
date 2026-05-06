import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes") ?? "";

  if (!mes) return NextResponse.json({ ingresos: [], egresos: [] });

  const [year, month] = mes.split("-").map(Number);
  const inicioMes = new Date(year, month - 1, 1);
  const finMes    = new Date(year, month, 1);

  const [ingresos, egresos, gastosPagados] = await Promise.all([
    prisma.ingreso.findMany({
      where: { fecha: { gte: inicioMes, lt: finMes } },
      orderBy: { fecha: "desc" },
    }),
    prisma.egreso.findMany({
      where: { fecha: { gte: inicioMes, lt: finMes } },
      orderBy: { fecha: "desc" },
    }),
    prisma.gastoComun.findMany({
      where: {
        estadoPago: "PAGADO",
        fechaPago: { gte: inicioMes, lt: finMes },
      },
      include: { departamento: { include: { torre: true } } },
      orderBy: { fechaPago: "desc" },
    }),
  ]);

  const totalIngresos     = ingresos.reduce((acc, i) => acc + i.monto, 0);
  const totalEgresos      = egresos.reduce((acc, e) => acc + e.monto, 0);
  const totalGastosPagados = gastosPagados.reduce((acc, g) => acc + g.monto, 0);
  const balance           = totalGastosPagados + totalIngresos - totalEgresos;

  return NextResponse.json({
    ingresos,
    egresos,
    gastosPagados,
    totales: { totalIngresos, totalEgresos, totalGastosPagados, balance },
  });
}

export async function DELETE(req: Request) {
  const { id, tipo } = await req.json();
  if (tipo === "ingreso") {
    await prisma.ingreso.delete({ where: { id } });
  } else {
    await prisma.egreso.delete({ where: { id } });
  }
  return NextResponse.json({ ok: true });
}