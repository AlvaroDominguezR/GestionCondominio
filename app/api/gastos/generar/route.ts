import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { mes } = await req.json();
  const [year, month] = mes.split("-").map(Number);
  const periodo = new Date(year, month - 1, 1);
  const periodoFin = new Date(year, month, 1);

  const config = await prisma.configuracion.findFirst();
  if (!config || config.montoMensual === 0) {
    return NextResponse.json({ error: "Define el monto mensual primero." }, { status: 400 });
  }

  // Verificar que no existan cobros para ese mes
  const existentes = await prisma.gastoComun.count({
    where: { periodo: { gte: periodo, lt: periodoFin } },
  });
  if (existentes > 0) {
    return NextResponse.json({ error: "Ya existen cobros para este período." }, { status: 400 });
  }

  // Obtener deptos ocupados (con al menos un residente)
  const deptos = await prisma.departamento.findMany({
    where: { residentes: { some: {} } },
    select: { id: true },
  });

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