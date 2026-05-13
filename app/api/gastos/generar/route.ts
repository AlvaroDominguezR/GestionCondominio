import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { mes } = await req.json();
  const [year, month] = mes.split("-").map(Number);
  const periodo = new Date(Date.UTC(year, month - 1, 1));
  const periodoFin = new Date(Date.UTC(year, month, 1));

  const config = await prisma.configuracion.findFirst();
  if (!config || config.montoMensual === 0) {
    return NextResponse.json({ error: "Define el monto mensual primero." }, { status: 400 });
  }

  // Obtener deptos que YA tienen cobro para ese mes
  const deptosConCobro = await prisma.gastoComun.findMany({
    where: { periodo: { gte: periodo, lt: periodoFin } },
    select: { departamentoId: true },
  });
  const idsConCobro = new Set(deptosConCobro.map((g) => g.departamentoId));

  // Obtener deptos ocupados que NO tienen cobro aún
  const deptos = await prisma.departamento.findMany({
    where: {
      residentes: { some: {} },
      id: { notIn: idsConCobro.size > 0 ? [...idsConCobro] : undefined },
    },
    select: { id: true },
  });

  if (deptos.length === 0) {
    return NextResponse.json({ ok: true, generados: 0, message: "Ya existen cobros para todos los departamentos de este período." });
  }

  // Crear gastos en lote
  await prisma.gastoComun.createMany({
    data: deptos.map((d) => ({
      departamentoId: d.id,
      monto:          config.montoMensual,
      periodo,
      estadoPago:     "PENDIENTE",
    })),
  });

  return NextResponse.json({ ok: true, generados: deptos.length });
}
