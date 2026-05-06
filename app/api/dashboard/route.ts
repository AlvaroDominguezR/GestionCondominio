import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const hoy = new Date();

  // Usar año y mes directamente para evitar desfase UTC
  const year  = hoy.getFullYear();
  const month = hoy.getMonth(); // 0-indexed

  const inicioMes = new Date(year, month, 1);
  const finMes    = new Date(year, month + 1, 1);

  // Inicio de hoy y fin de semana (7 días)
  const inicioDia = new Date(year, month, hoy.getDate());
  const finSemana = new Date(year, month, hoy.getDate() + 7);

  const [
    totalDeptos,
    deptosOcupados,
    totalHabitantes,
    totalVehiculos,
    gastosMes,
    ingresosMes,
    egresosMes,
    ultimosMovimientos,
    avisosSemana,
  ] = await Promise.all([
    prisma.departamento.count(),
    prisma.departamento.count({ where: { residentes: { some: {} } } }),
    prisma.residente.count(),
    prisma.vehiculo.count(),
    // Buscar gastos del mes actual por periodo
    prisma.gastoComun.findMany({
      where: {
        periodo: { gte: inicioMes, lt: finMes },
      },
      select: { monto: true, estadoPago: true },
    }),
    prisma.ingreso.findMany({
      where: { fecha: { gte: inicioMes, lt: finMes } },
      select: { monto: true },
    }),
    prisma.egreso.findMany({
      where: { fecha: { gte: inicioMes, lt: finMes } },
      select: { monto: true },
    }),
    prisma.gastoComun.findMany({
      where: { estadoPago: "PAGADO" },
      orderBy: { fechaPago: "desc" },
      take: 6,
      include: { departamento: { include: { torre: true } } },
    }),
    prisma.aviso.findMany({
      where: { fecha: { gte: inicioDia, lte: finSemana } },
      orderBy: { fecha: "asc" },
    }),
  ]);

  const gastosPagados    = gastosMes.filter((g) => g.estadoPago === "PAGADO");
  const gastosPendientes = gastosMes.filter((g) => g.estadoPago === "PENDIENTE");
  const gastosAtrasados  = gastosMes.filter((g) => g.estadoPago === "ATRASADO");

  const totalGastosPagados  = gastosPagados.reduce((acc, g) => acc + g.monto, 0);
  const totalIngresos       = ingresosMes.reduce((acc, g) => acc + g.monto, 0);
  const totalEgresos        = egresosMes.reduce((acc, g) => acc + g.monto, 0);
  const balance             = totalGastosPagados + totalIngresos - totalEgresos;

  return NextResponse.json({
    stats: {
      totalDeptos,
      deptosOcupados,
      totalHabitantes,
      totalVehiculos,
    },
    balance: {
      gastosPagados:    totalGastosPagados,
      ingresosManuales: totalIngresos,
      egresos:          totalEgresos,
      balance,
      pendientes:       gastosPendientes.length,
      atrasados:        gastosAtrasados.length,
    },
    ultimosMovimientos,
    avisosSemana,
  });
}