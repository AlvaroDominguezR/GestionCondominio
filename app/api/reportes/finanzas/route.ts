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

  const [perfil, ingresos, egresos, gastosPagados] = await Promise.all([
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
  ]);

  const totalIngresos      = ingresos.reduce((acc, i) => acc + i.monto, 0);
  const totalEgresos       = egresos.reduce((acc, e) => acc + e.monto, 0);
  const totalGastosPagados = gastosPagados.reduce((acc, g) => acc + g.monto, 0);
  const balance            = totalGastosPagados + totalIngresos - totalEgresos;

  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const mesLabel = `${meses[month - 1]} ${year}`;

  const buffer = await renderToBuffer(
    React.createElement(ReporteFinanzasPDF, {
      perfil,
      mes: mesLabel,
      ingresos,
      egresos,
      gastosPagados,
      totales: { totalIngresos, totalEgresos, totalGastosPagados, balance },
    }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
  headers: {
    "Content-Type": "application/pdf",
    "Content-Disposition": `attachment; filename="finanzas-${mes}.pdf"`,
    },
 });
}