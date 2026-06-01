import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { VoucherPagoPDF } from "@/components/VoucherPagoPDF";
import React from "react";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const idsParam = searchParams.get("ids");

  if (!idsParam) {
    return NextResponse.json({ error: "IDs requeridos" }, { status: 400 });
  }

  const ids = idsParam
    .split(",")
    .map((s) => parseInt(s.trim(), 10))
    .filter((n) => !isNaN(n));

  if (ids.length === 0) {
    return NextResponse.json({ error: "IDs inválidos" }, { status: 400 });
  }

  const [perfil, gastos] = await Promise.all([
    prisma.perfilCondominio.findFirst(),
    prisma.gastoComun.findMany({
      where: { id: { in: ids }, estadoPago: { in: ["PAGADO", "HISTORICO_PAGADO"] } },
      include: {
        departamento: {
          include: {
            torre: true,
            dueno: true,
            residentes: {
              where: { esJefeHogar: true },
              take: 1,
            },
          },
        },
      },
      orderBy: { periodo: "asc" },
    }),
  ]);

  if (gastos.length === 0) {
    return NextResponse.json({ error: "No se encontraron pagos para los IDs indicados" }, { status: 404 });
  }

  const depto = gastos[0].departamento;
  const jefeHogar = depto.residentes[0]?.nombre ?? null;

  const buffer = await renderToBuffer(
    React.createElement(VoucherPagoPDF, {
      perfil,
      depto: {
        numero: depto.numero,
        torre: depto.torre,
        dueno: depto.dueno,
      },
      jefeHogar,
      gastos: gastos.map((g) => ({
        id: g.id,
        monto: g.monto,
        periodo: g.periodo,
        fechaPago: g.fechaPago,
        metodoPago: g.metodoPago,
        codigoTransaccion: g.codigoTransaccion,
      })),
    }) as any
  );

  const deptoNumero = depto.numero || String(depto.id);

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="voucher-depto-${deptoNumero}.pdf"`,
    },
  });
}
