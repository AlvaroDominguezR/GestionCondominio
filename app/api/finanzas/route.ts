import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MESES_ABREV = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes") ?? "";

  if (!mes) return NextResponse.json({ ingresos: [], egresos: [], gastosPagados: [] });

  const [year, month] = mes.split("-").map(Number);
  const inicioMes = new Date(year, month - 1, 1);
  const finMes    = new Date(year, month, 1);

  const [ingresos, egresos, gastosPagadosRaw, prevIngresosAgg, prevEgresosAgg, prevGastosPagadosAgg] = await Promise.all([
    prisma.ingreso.findMany({
      where: { fecha: { gte: inicioMes, lt: finMes } },
      orderBy: { fecha: "desc" },
    }),
    prisma.egreso.findMany({
      where: { fecha: { gte: inicioMes, lt: finMes } },
      orderBy: { fecha: "desc" },
    }),
    // Gastos cuya fechaPago cayó en este mes
    prisma.gastoComun.findMany({
      where: {
        estadoPago: "PAGADO",
        fechaPago: { gte: inicioMes, lt: finMes },
      },
      include: { departamento: { include: { torre: true } } },
      orderBy: { fechaPago: "desc" },
    }),
    prisma.ingreso.aggregate({
      where: { fecha: { lt: inicioMes } },
      _sum: { monto: true },
    }),
    prisma.egreso.aggregate({
      where: { fecha: { lt: inicioMes } },
      _sum: { monto: true },
    }),
    prisma.gastoComun.aggregate({
      where: {
        estadoPago: "PAGADO",
        fechaPago: { lt: inicioMes },
      },
      _sum: { monto: true },
    }),
  ]);

  // Agrupar gastos por departamento dentro del mes
  const mapa: Record<string, {
    deptoId: number;
    numero: string;
    torre: string;
    mesesPorAnio: Record<number, string[]>;
    totalMonto: number;
    fechaPago: string | null;
  }> = {};

  for (const g of gastosPagadosRaw) {
    const key    = `${g.departamentoId}`;
    const fecha  = new Date(g.periodo);
    const anio   = fecha.getFullYear();
    const mesIdx = fecha.getMonth();

    if (!mapa[key]) {
      mapa[key] = {
        deptoId:      g.departamentoId,
        numero:       g.departamento.numero || "S/N",
        torre:        g.departamento.torre.nombre,
        mesesPorAnio: {},
        totalMonto:   0,
        fechaPago:    g.fechaPago ? g.fechaPago.toISOString() : null,
      };
    }

    if (!mapa[key].mesesPorAnio[anio]) {
      mapa[key].mesesPorAnio[anio] = [];
    }

    mapa[key].mesesPorAnio[anio].push(MESES_ABREV[mesIdx]);
    mapa[key].totalMonto += g.monto;
  }

  const gastosPagados = Object.values(mapa).map((item) => {
    const partes = Object.entries(item.mesesPorAnio)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([anio, meses]) => `${anio}: ${meses.join(", ")}`);

    return {
      deptoId:    item.deptoId,
      numero:     item.numero,
      torre:      item.torre,
      mesesLabel: partes.join(" / "),
      totalMonto: item.totalMonto,
      fechaPago:  item.fechaPago,
    };
  }).sort((a, b) => {
    if (!a.fechaPago) return 1;
    if (!b.fechaPago) return -1;
    return new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime();
  });

  const totalIngresos      = ingresos.reduce((acc, i) => acc + i.monto, 0);
  const totalEgresos       = egresos.reduce((acc, e) => acc + e.monto, 0);
  const totalGastosPagados = gastosPagados.reduce((acc, g) => acc + g.totalMonto, 0);

  const totalPrevIngresos      = prevIngresosAgg._sum.monto ?? 0;
  const totalPrevEgresos       = prevEgresosAgg._sum.monto ?? 0;
  const totalPrevGastosPagados = prevGastosPagadosAgg._sum.monto ?? 0;
  const saldoInicial           = totalPrevGastosPagados + totalPrevIngresos - totalPrevEgresos;
  const balance                = totalGastosPagados + totalIngresos - totalEgresos;
  const saldoFinal             = saldoInicial + balance;

  return NextResponse.json({
    ingresos,
    egresos,
    gastosPagados,
    totales: { totalIngresos, totalEgresos, totalGastosPagados, balance, saldoInicial, saldoFinal },
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