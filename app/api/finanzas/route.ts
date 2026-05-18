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

  // Separar ingresos normales de pagos de deuda histórica
  const ingresosNormales   = ingresos.filter((i) => !i.descripcion.startsWith("[HC-"));
  const ingresosHistoricos = ingresos.filter((i) =>  i.descripcion.startsWith("[HC-"));

  // Obtener los gastoIds del prefijo [HC-{id}] para consultar periodo y torre reales
  const gastoIds = ingresosHistoricos
    .map((i) => { const m = i.descripcion.match(/^\[HC-(\d+)\]/); return m ? Number(m[1]) : null; })
    .filter((id): id is number => id !== null);

  const gastosHistoricosRaw = gastoIds.length
    ? await prisma.gastoComun.findMany({
        where: { id: { in: gastoIds } },
        include: { departamento: { include: { torre: true } } },
      })
    : [];

  const gastoMap = new Map(gastosHistoricosRaw.map((g) => [g.id, g]));

  const mapaHistorico: Record<string, {
    deptoId: number; numero: string; torre: string;
    mesesPorAnio: Record<number, string[]>; totalMonto: number; fechaPago: string;
    metodoPago: string | null;
  }> = {};

  for (const ing of ingresosHistoricos) {
    const match = ing.descripcion.match(/^\[HC-(\d+)\]/);
    if (!match) continue;
    const gasto = gastoMap.get(Number(match[1]));
    if (!gasto) continue;

    const deptoId  = gasto.departamentoId;
    const metodo   = (ing as any).metodoPago ?? "TRANSFERENCIA";
    const key      = `${deptoId}-${metodo}`;
    const p        = new Date(gasto.periodo);
    const anio     = p.getUTCFullYear();
    const mesIdx   = p.getUTCMonth();

    if (!mapaHistorico[key]) {
      mapaHistorico[key] = {
        deptoId,
        numero:       gasto.departamento.numero || "S/N",
        torre:        gasto.departamento.torre.nombre,
        mesesPorAnio: {},
        totalMonto:   0,
        fechaPago:    ing.fecha.toISOString(),
        metodoPago:   metodo,
      };
    }
    if (!mapaHistorico[key].mesesPorAnio[anio])
      mapaHistorico[key].mesesPorAnio[anio] = [];

    mapaHistorico[key].mesesPorAnio[anio].push(MESES_ABREV[mesIdx]);
    mapaHistorico[key].totalMonto += ing.monto;
  }

  const pagosHistoricos = Object.values(mapaHistorico).map((item) => {
    const partes = Object.entries(item.mesesPorAnio)
      .sort(([a], [b]) => Number(a) - Number(b))
      .map(([anio, meses]) => {
        const sorted = [...meses].sort((a, b) => MESES_ABREV.indexOf(a) - MESES_ABREV.indexOf(b));
        return `${anio}: ${sorted.join(", ")}`;
      });
    return {
      deptoId:    item.deptoId,
      numero:     item.numero,
      torre:      item.torre,
      mesesLabel: partes.join(" / "),
      totalMonto: item.totalMonto,
      fechaPago:  item.fechaPago,
      metodoPago: item.metodoPago,
    };
  }).sort((a, b) => new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime());

  // Agrupar gastos por departamento dentro del mes
  const mapa: Record<string, {
    deptoId: number;
    numero: string;
    torre: string;
    mesesPorAnio: Record<number, string[]>;
    totalMonto: number;
    fechaPago: string | null;
    metodoPago: string | null;
  }> = {};

  for (const g of gastosPagadosRaw) {
    const metodo = (g as any).metodoPago ?? "TRANSFERENCIA";
    const key    = `${g.departamentoId}-${metodo}`;
    const fecha  = new Date(g.periodo);
    const anio   = fecha.getUTCFullYear();
    const mesIdx = fecha.getUTCMonth();

    if (!mapa[key]) {
      mapa[key] = {
        deptoId:      g.departamentoId,
        numero:       g.departamento.numero || "S/N",
        torre:        g.departamento.torre.nombre,
        mesesPorAnio: {},
        totalMonto:   0,
        fechaPago:    g.fechaPago ? g.fechaPago.toISOString() : null,
        metodoPago:   metodo,
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
      .map(([anio, meses]) => {
        const sorted = [...meses].sort((a, b) => MESES_ABREV.indexOf(a) - MESES_ABREV.indexOf(b));
        return `${anio}: ${sorted.join(", ")}`;
      });

    return {
      deptoId:    item.deptoId,
      numero:     item.numero,
      torre:      item.torre,
      mesesLabel: partes.join(" / "),
      totalMonto: item.totalMonto,
      fechaPago:  item.fechaPago,
      metodoPago: item.metodoPago,
    };
  }).sort((a, b) => {
    if (!a.fechaPago) return 1;
    if (!b.fechaPago) return -1;
    return new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime();
  });

  const totalIngresos         = ingresosNormales.reduce((acc, i) => acc + i.monto, 0);
  const totalEgresos          = egresos.reduce((acc, e) => acc + e.monto, 0);
  const totalGastosPagados    = gastosPagados.reduce((acc, g) => acc + g.totalMonto, 0);
  const totalPagosHistoricos  = ingresosHistoricos.reduce((acc, i) => acc + i.monto, 0);

  const totalPrevIngresos      = prevIngresosAgg._sum.monto ?? 0;
  const totalPrevEgresos       = prevEgresosAgg._sum.monto ?? 0;
  const totalPrevGastosPagados = prevGastosPagadosAgg._sum.monto ?? 0;
  const saldoInicial           = totalPrevGastosPagados + totalPrevIngresos - totalPrevEgresos;
  const balance                = totalGastosPagados + totalIngresos + totalPagosHistoricos - totalEgresos;
  const saldoFinal             = saldoInicial + balance;

  return NextResponse.json({
    ingresos:        ingresosNormales,
    egresos,
    gastosPagados,
    pagosHistoricos,
    totales: { totalIngresos, totalEgresos, totalGastosPagados, totalPagosHistoricos, balance, saldoInicial, saldoFinal },
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