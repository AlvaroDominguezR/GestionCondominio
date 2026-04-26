import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes") ?? "";

  // Obtener o crear configuración
  let config = await prisma.configuracion.findFirst();
  if (!config) {
    config = await prisma.configuracion.create({ data: { montoMensual: 0 } });
  }

  if (!mes) return NextResponse.json({ gastos: [], stats: {}, config });

  const [year, month] = mes.split("-").map(Number);
  const periodoInicio = new Date(year, month - 1, 1);
  const periodoFin    = new Date(year, month, 1);

  // Marcar atrasados automáticamente
  const hoy = new Date();
  if (periodoFin < hoy) {
    await prisma.gastoComun.updateMany({
      where: { periodo: { gte: periodoInicio, lt: periodoFin }, estadoPago: "PENDIENTE" },
      data:  { estadoPago: "ATRASADO" },
    });
  }

  const gastos = await prisma.gastoComun.findMany({
    where: { periodo: { gte: periodoInicio, lt: periodoFin } },
    include: { departamento: { include: { torre: true } } },
    orderBy: [{ departamento: { torre: { nombre: "asc" } } }, { departamento: { numero: "asc" } }],
  });

  const pagados    = gastos.filter((g) => g.estadoPago === "PAGADO").length;
  const pendientes = gastos.filter((g) => g.estadoPago === "PENDIENTE").length;
  const atrasados  = gastos.filter((g) => g.estadoPago === "ATRASADO").length;
  const montoTotal  = gastos.reduce((acc, g) => acc + g.monto, 0);
  const montoPagado = gastos.filter((g) => g.estadoPago === "PAGADO").reduce((acc, g) => acc + g.monto, 0);

  return NextResponse.json({
    gastos,
    config,
    stats: { totalDeptos: gastos.length, pagados, pendientes, atrasados, montoTotal, montoPagado },
  });
}