import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReporteGastosPDF } from "@/components/ReporteGastosPDF";
import React from "react";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const mes = searchParams.get("mes") ?? "";

  if (!mes) return NextResponse.json({ error: "Mes requerido" }, { status: 400 });

  const [year, month] = mes.split("-").map(Number);
  const inicioMes = new Date(year, month - 1, 1);
  const finMes    = new Date(year, month, 1);

  const [perfil, todosGastos] = await Promise.all([
    prisma.perfilCondominio.findFirst(),
    prisma.gastoComun.findMany({
      where: { periodo: { gte: inicioMes, lt: finMes } },
      include: { departamento: { include: { torre: true } } },
      orderBy: [{ departamento: { torre: { nombre: "asc" } } }, { departamento: { numero: "asc" } }],
    }),
  ]);

  const pagados    = todosGastos.filter((g) => g.estadoPago === "PAGADO");
  const pendientes = todosGastos.filter((g) => g.estadoPago === "PENDIENTE");
  const atrasados  = todosGastos.filter((g) => g.estadoPago === "ATRASADO");

  const montoPagado    = pagados.reduce((acc, g) => acc + g.monto, 0);
  const montoPendiente = pendientes.reduce((acc, g) => acc + g.monto, 0);
  const montoAtrasado  = atrasados.reduce((acc, g) => acc + g.monto, 0);

  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  const mesLabel = `${meses[month - 1]} ${year}`;

  const buffer = await renderToBuffer(
    React.createElement(ReporteGastosPDF, {
      perfil,
      mes: mesLabel,
      pagados,
      pendientes,
      atrasados,
      totales: { montoPagado, montoPendiente, montoAtrasado, totalDeptos: todosGastos.length },
    }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="gastos-${mes}.pdf"`,
    },
  });
}