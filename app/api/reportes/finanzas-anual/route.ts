import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReporteFinanzasAnualPDF } from "@/components/ReporteFinanzasAnualPDF";
import React from "react";

const MESES_ABREV = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];
const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mesInicio = searchParams.get("mesInicio") ?? "";
  const mesFin    = searchParams.get("mesFin") ?? "";

  if (!mesInicio || !mesFin) {
    return NextResponse.json({ error: "Rango de meses requerido" }, { status: 400 });
  }

  const [yearInicio, monthInicio] = mesInicio.split("-").map(Number);
  const [yearFin, monthFin]       = mesFin.split("-").map(Number);
  const fin = new Date(yearFin, monthFin, 1);

  const [perfil, prevIngresosAgg, prevEgresosAgg, prevGastosPagadosAgg] = await Promise.all([
    prisma.perfilCondominio.findFirst(),
    prisma.ingreso.aggregate({ where: { fecha: { lt: new Date(yearInicio, monthInicio - 1, 1) } }, _sum: { monto: true } }),
    prisma.egreso.aggregate({ where: { fecha: { lt: new Date(yearInicio, monthInicio - 1, 1) } }, _sum: { monto: true } }),
    prisma.gastoComun.aggregate({ where: { estadoPago: "PAGADO", fechaPago: { lt: new Date(yearInicio, monthInicio - 1, 1) } }, _sum: { monto: true } }),
  ]);

  const totalPrevIngresos      = prevIngresosAgg._sum.monto ?? 0;
  const totalPrevEgresos       = prevEgresosAgg._sum.monto ?? 0;
  const totalPrevGastosPagados = prevGastosPagadosAgg._sum.monto ?? 0;
  const saldoInicial           = totalPrevGastosPagados + totalPrevIngresos - totalPrevEgresos;

  // Generar lista de meses
  const mesesRango: { label: string; inicio: Date; fin: Date }[] = [];
  let current = new Date(yearInicio, monthInicio - 1, 1);

  while (current < fin) {
    const siguiente = new Date(current.getFullYear(), current.getMonth() + 1, 1);
    mesesRango.push({
      label:  `${MESES[current.getMonth()]} ${current.getFullYear()}`,
      inicio: new Date(current),
      fin:    siguiente,
    });
    current = siguiente;
  }

  // Obtener detalle por mes
  const meses = await Promise.all(
    mesesRango.map(async ({ label, inicio: ini, fin: fi }) => {
      const [gastosRaw, ingresosTodos, egresos] = await Promise.all([
        prisma.gastoComun.findMany({
          where: { estadoPago: "PAGADO", fechaPago: { gte: ini, lt: fi } },
          include: { departamento: { include: { torre: true } } },
          orderBy: [{ departamento: { torre: { nombre: "asc" } } }, { departamento: { numero: "asc" } }],
        }),
        prisma.ingreso.findMany({
          where: { fecha: { gte: ini, lt: fi } },
          orderBy: { fecha: "asc" },
        }),
        prisma.egreso.findMany({
          where: { fecha: { gte: ini, lt: fi } },
          orderBy: { fecha: "asc" },
        }),
      ]);

      // Separar ingresos normales de pagos históricos
      const ingresos   = ingresosTodos.filter((i) => !i.descripcion.startsWith("[HC-"));
      const ingresosHC = ingresosTodos.filter((i) =>  i.descripcion.startsWith("[HC-"));

      // Agrupar gastos por departamento + método de pago
      const mapa: Record<string, { numero: string; torre: string; mesesPorAnio: Record<number, string[]>; totalMonto: number; metodoPago: string | null }> = {};
      for (const g of gastosRaw) {
        const metodo = (g as any).metodoPago ?? "TRANSFERENCIA";
        const key    = `${g.departamentoId}-${metodo}`;
        const fecha  = new Date(g.periodo);
        const anio   = fecha.getUTCFullYear();
        const mesIdx = fecha.getUTCMonth();
        if (!mapa[key]) {
          mapa[key] = { numero: g.departamento.numero || "S/N", torre: g.departamento.torre.nombre, mesesPorAnio: {}, totalMonto: 0, metodoPago: metodo };
        }
        if (!mapa[key].mesesPorAnio[anio]) mapa[key].mesesPorAnio[anio] = [];
        mapa[key].mesesPorAnio[anio].push(MESES_ABREV[mesIdx]);
        mapa[key].totalMonto += g.monto;
      }

      const gastosPagados = Object.values(mapa).map((item) => {
        const partes = Object.entries(item.mesesPorAnio)
          .sort(([a], [b]) => Number(a) - Number(b))
          .map(([anio, meses]) => `${anio}: ${meses.join(", ")}`);
        return { numero: item.numero, torre: item.torre, mesesLabel: partes.join(" / "), totalMonto: item.totalMonto, metodoPago: item.metodoPago };
      }).sort((a, b) => a.torre.localeCompare(b.torre) || a.numero.localeCompare(b.numero));

      // Reconstruir pagos históricos (HC) agrupados por departamento
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
      const mapaHC: Record<number, { deptoId: number; numero: string; torre: string; mesesPorAnio: Record<number, string[]>; totalMonto: number; metodoPago: string | null }> = {};

      for (const ing of ingresosHC) {
        const match = ing.descripcion.match(/^\[HC-(\d+)\]/);
        if (!match) continue;
        const gasto = gastoHCMap.get(Number(match[1]));
        if (!gasto) continue;
        const deptoId = gasto.departamentoId;
        const p       = new Date(gasto.periodo);
        const anio    = p.getUTCFullYear();
        const mesIdx  = p.getUTCMonth();
        if (!mapaHC[deptoId]) {
          mapaHC[deptoId] = { deptoId, numero: gasto.departamento.numero || "S/N", torre: gasto.departamento.torre.nombre, mesesPorAnio: {}, totalMonto: 0, metodoPago: (ing as any).metodoPago ?? null };
        }
        if (!mapaHC[deptoId].mesesPorAnio[anio]) mapaHC[deptoId].mesesPorAnio[anio] = [];
        mapaHC[deptoId].mesesPorAnio[anio].push(MESES_ABREV[mesIdx]);
        mapaHC[deptoId].totalMonto += ing.monto;
      }

      const pagosHistoricos = Object.values(mapaHC).map((item) => {
        const partes     = Object.entries(item.mesesPorAnio).sort(([a],[b]) => Number(a)-Number(b));
        const mesesLabel = partes.map(([anio, meses]) => `${anio}: ${meses.join(", ")}`).join(" / ");
        const cantMeses  = partes.reduce((acc, [, meses]) => acc + meses.length, 0);
        return { numero: item.numero, torre: item.torre, mesesLabel, cantMeses, totalMonto: item.totalMonto, metodoPago: item.metodoPago };
      }).sort((a, b) => a.torre.localeCompare(b.torre) || a.numero.localeCompare(b.numero));

      const totalGastos           = gastosPagados.reduce((acc, g) => acc + g.totalMonto, 0);
      const totalIngresos         = ingresos.reduce((acc, i) => acc + i.monto, 0);
      const totalEgresos          = egresos.reduce((acc, e) => acc + e.monto, 0);
      const totalPagosHistoricos  = ingresosHC.reduce((acc, i) => acc + i.monto, 0);
      const balance               = totalGastos + totalIngresos + totalPagosHistoricos - totalEgresos;

      return { label, gastosPagados, ingresos, egresos, pagosHistoricos, totalGastos, totalIngresos, totalEgresos, totalPagosHistoricos, balance, saldoApertura: 0, saldoCierre: 0 };
    })
  );

  let saldoAcumulado = saldoInicial;
  const mesesConSaldo = meses.map((m) => {
    const apertura = saldoAcumulado;
    const cierre   = apertura + m.balance;
    saldoAcumulado = cierre;
    return { ...m, saldoApertura: apertura, saldoCierre: cierre };
  });

  const totales = mesesConSaldo.reduce(
    (acc, m) => ({
      totalGastos:          acc.totalGastos          + m.totalGastos,
      totalIngresos:        acc.totalIngresos        + m.totalIngresos,
      totalEgresos:         acc.totalEgresos         + m.totalEgresos,
      totalPagosHistoricos: acc.totalPagosHistoricos + m.totalPagosHistoricos,
      balance:              acc.balance              + m.balance,
    }),
    { totalGastos: 0, totalIngresos: 0, totalEgresos: 0, totalPagosHistoricos: 0, balance: 0 }
  );

  const periodoLabel = `${MESES[monthInicio - 1]} ${yearInicio} — ${MESES[monthFin - 1]} ${yearFin}`;

  const buffer = await renderToBuffer(
    React.createElement(ReporteFinanzasAnualPDF, {
      perfil,
      periodo: periodoLabel,
      meses: mesesConSaldo,
      totales: { ...totales, saldoInicial, saldoFinal: saldoAcumulado },
    }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="finanzas-${mesInicio}-${mesFin}.pdf"`,
    },
  });
}
