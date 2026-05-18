import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReporteDeudaHistoricaPDF } from "@/components/ReporteDeudaHistoricaPDF";
import React from "react";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");

  if (!id) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const [perfil, depto] = await Promise.all([
    prisma.perfilCondominio.findFirst(),
    prisma.departamento.findUnique({
      where: { id: Number(id) },
      include: {
        torre: true,
        dueno: true,
        gastosComunes: {
          where: { estadoPago: { in: ["HISTORICO", "HISTORICO_PAGADO"] } },
          orderBy: { periodo: "asc" },
        },
      },
    }),
  ]);

  if (!depto) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  const totalDeuda  = depto.gastosComunes.filter((g) => g.estadoPago === "HISTORICO").reduce((acc, g) => acc + g.monto, 0);
  const totalPagado = depto.gastosComunes.filter((g) => g.estadoPago === "HISTORICO_PAGADO").reduce((acc, g) => acc + g.monto, 0);

  const buffer = await renderToBuffer(
    React.createElement(ReporteDeudaHistoricaPDF, {
      perfil,
      depto,
      gastos:      depto.gastosComunes,
      totalDeuda,
      totalPagado,
    }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="deuda-historica-depto-${depto.numero || id}.pdf"`,
    },
  });
}