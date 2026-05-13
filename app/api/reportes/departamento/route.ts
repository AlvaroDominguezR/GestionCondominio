import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import { renderToBuffer } from "@react-pdf/renderer";
import { ReporteDepartamentoPDF } from "@/components/ReporteDepartamentoPDF";
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
        residentes: { orderBy: { esJefeHogar: "desc" } },
        gastosComunes: { orderBy: { periodo: "desc" } },
      },
    }),
  ]);

  if (!depto) return NextResponse.json({ error: "Departamento no encontrado" }, { status: 404 });

  const buffer = await renderToBuffer(
    React.createElement(ReporteDepartamentoPDF, {
      perfil,
      depto,
      residentes: depto.residentes,
      gastosComunes: depto.gastosComunes,
    }) as any
  );

  return new NextResponse(buffer as unknown as BodyInit, {
    headers: {
      "Content-Type": "application/pdf",
      "Content-Disposition": `attachment; filename="depto-${depto.numero || id}.pdf"`,
    },
  });
}