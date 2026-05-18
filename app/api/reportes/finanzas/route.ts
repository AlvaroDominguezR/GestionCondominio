import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReporteFinanzasPDF } from "@/components/ReporteFinanzasPDF";
import React from "react";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes") ?? "";

  if (!mes) return NextResponse.json({ error: "Mes requerido" }, { status: 400 });

  const [year, month] = mes.split("-").map(Number);
  const inicioMes = new Date(year, month - 1, 1);
  const finMes    = new Date(year, month, 1);

  const MESES_ABREV = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

  const [perfil, ingresosTodos, egresos, gastosPagados, prevIngresosAgg, prevEgresosAgg, prevGastosPagadosAgg] = await Promise.all([
    prisma.perfilCondominio.findFirst(),
    prisma.ingreso.findMany({
      where: { fecha: { gte: inicioMes, lt: finMes } },
      orderBy: { fecha: "asc" },
    }),
    prisma.egreso.findMany({
      where: { fecha: { gte: inicioMes, lt: finMes } },
      orderBy: { fecha: "asc" },
    }),
    prisma.gastoComun.findMany({
      where: { estadoPago: "PAGADO", fechaPago: { gte: inicioMes, lt: finMes } },
      include: { departamento: { include: { torre: true } } },
      orderBy: { fechaPago: "asc" },
    }),
    prisma.ingreso.aggregate({ where: { fecha: { lt: inicioMes } }, _sum: { monto: true } }),
    prisma.egreso.aggregate({ where: { fecha: { lt: inicioMes } }, _sum: { monto: true } }),
    prisma.gastoComun.aggregate({ where: { estadoPago: "PAGADO", fechaPago: { lt: inicioMes } }, _sum: { monto: true } }),
  ]);

  const ingresos         = ingresosTodos.filter((i) => !i.descripcion.startsWith("[HC-"));
  const ingresosHC       = ingresosTodos.filter((i) =>  i.descripcion.startsWith("[HC-"));

  // Agrupar pagos históricos por departamento (misma lógica que finanzas/route.ts)
  const gastoIds = ingresosHC
    .map((i) => { const m = i.descripcion.match(/^\[HC-(\d+)\]/); return m ? Number(m[1]) : null; })
    .filter((id): id is number => id !== null);

  const gastosHCRaw = gastoIds.length
    ? await prisma.gastoComun.findMany({
        where: { id: { in: gastoIds } },
        include: { departamento: { include: { torre: true } } },
      })
    : [];

  const gastoHCMap = new Map(gastosHCRaw.map((g) => [g.id, g]));
  const mapaHC: Record<string, { deptoId: number; numero: string; torre: string; mesesPorAnio: Record<number, string[]>; totalMonto: number; fechaPago: string; metodoPago: string | null }> = {};

  for (const ing of ingresosHC) {
    const match = ing.descripcion.match(/^\[HC-(\d+)\]/);
    if (!match) continue;
    const gasto = gastoHCMap.get(Number(match[1]));
    if (!gasto) continue;
    const deptoId = gasto.departamentoId;
    const metodo  = (ing as any).metodoPago ?? "TRANSFERENCIA";
    const key     = `${deptoId}-${metodo}`;
    const p       = new Date(gasto.periodo);
    const anio    = p.getUTCFullYear();
    const mesIdx  = p.getUTCMonth();
    if (!mapaHC[key]) {
      mapaHC[key] = { deptoId, numero: gasto.departamento.numero || "S/N", torre: gasto.departamento.torre.nombre, mesesPorAnio: {}, totalMonto: 0, fechaPago: ing.fecha.toISOString(), metodoPago: metodo };
    }
    if (!mapaHC[key].mesesPorAnio[anio]) mapaHC[key].mesesPorAnio[anio] = [];
    mapaHC[key].mesesPorAnio[anio].push(MESES_ABREV[mesIdx]);
    mapaHC[key].totalMonto += ing.monto;
  }

  const pagosHistoricos = Object.values(mapaHC).map((item) => {
    const partes    = Object.entries(item.mesesPorAnio).sort(([a],[b]) => Number(a)-Number(b));
    const mesesLabel = partes.map(([anio, meses]) => {
      const sorted = [...meses].sort((a, b) => MESES_ABREV.indexOf(a) - MESES_ABREV.indexOf(b));
      return `${anio}: ${sorted.join(", ")}`;
    }).join(" / ");
    const cantMeses  = partes.reduce((acc, [, meses]) => acc + meses.length, 0);
    return { deptoId: item.deptoId, numero: item.numero, torre: item.torre, mesesLabel, cantMeses, totalMonto: item.totalMonto, fechaPago: item.fechaPago, metodoPago: item.metodoPago };
  }).sort((a, b) => a.torre.localeCompare(b.torre) || a.numero.localeCompare(b.numero));

  const totalIngresos        = ingresos.reduce((acc, i) => acc + i.monto, 0);
  const totalEgresos         = egresos.reduce((acc, e) => acc + e.monto, 0);
  const totalGastosPagados   = gastosPagados.reduce((acc, g) => acc + g.monto, 0);
  const totalPagosHistoricos = ingresosHC.reduce((acc, i) => acc + i.monto, 0);
  const balance              = totalGastosPagados + totalIngresos + totalPagosHistoricos - totalEgresos;

  const totalPrevIngresos      = prevIngresosAgg._sum.monto ?? 0;
  const totalPrevEgresos       = prevEgresosAgg._sum.monto ?? 0;
  const totalPrevGastosPagados = prevGastosPagadosAgg._sum.monto ?? 0;
  const saldoInicial           = totalPrevGastosPagados + totalPrevIngresos - totalPrevEgresos;
  const saldoFinal             = saldoInicial + balance;

  // Totales por método de pago (solo ingresos, no egresos)
  const totalTransferencia =
    gastosPagados.filter((g) => (g as any).metodoPago === "TRANSFERENCIA").reduce((acc, g) => acc + g.monto, 0) +
    ingresosHC.filter((i) => (i as any).metodoPago === "TRANSFERENCIA").reduce((acc, i) => acc + i.monto, 0) +
    ingresos.filter((i) => (i as any).metodoPago === "TRANSFERENCIA").reduce((acc, i) => acc + i.monto, 0);

  const totalEfectivo =
    gastosPagados.filter((g) => (g as any).metodoPago === "EFECTIVO").reduce((acc, g) => acc + g.monto, 0) +
    ingresosHC.filter((i) => (i as any).metodoPago === "EFECTIVO").reduce((acc, i) => acc + i.monto, 0) +
    ingresos.filter((i) => (i as any).metodoPago === "EFECTIVO").reduce((acc, i) => acc + i.monto, 0);

  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const mesLabel = `${meses[month - 1]} ${year}`;

  const buffer = await renderToBuffer(
    React.createElement(ReporteFinanzasPDF, {
      perfil,
      mes: mesLabel,
      ingresos,
      egresos,
      gastosPagados,
      pagosHistoricos,
      totales: { totalIngresos, totalEgresos, totalGastosPagados, totalPagosHistoricos, balance, saldoInicial, saldoFinal },
      totalesPorMetodo: { transferencia: totalTransferencia, efectivo: totalEfectivo },
    }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="finanzas-${mes}.pdf"`,
    },
 });
}