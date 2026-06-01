import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const departamentoId = Number(searchParams.get("departamentoId"));

  if (!departamentoId) return NextResponse.json({ error: "ID requerido" }, { status: 400 });

  const config = await prisma.configuracion.findFirst();

  // Traer todos los gastos históricos del departamento
  const gastos = await prisma.gastoComun.findMany({
    where: { departamentoId, estadoPago: { in: ["HISTORICO", "HISTORICO_PAGADO"] } },
    orderBy: { periodo: "asc" },
  });

  return NextResponse.json({ gastos, config });
}

export async function POST(req: Request) {
  const { departamentoId, mesInicio, mesFin } = await req.json();

  const config = await prisma.configuracion.findFirst();
  if (!config) return NextResponse.json({ error: "Sin configuración" }, { status: 400 });

  const [yearInicio, monthInicio] = mesInicio.split("-").map(Number);
  const [yearFin, monthFin]       = mesFin.split("-").map(Number);

  const meses = [];
  let current = new Date(yearInicio, monthInicio - 1, 1);
  const fin   = new Date(yearFin, monthFin, 1);

  while (current < fin) {
    meses.push(new Date(current));
    current = new Date(current.getFullYear(), current.getMonth() + 1, 1);
  }

  // Crear solo los meses que no existen aún
  for (const periodo of meses) {
    const existe = await prisma.gastoComun.findFirst({
      where: { departamentoId, periodo },
    });
    if (!existe) {
      const anio  = periodo.getFullYear();
      const monto = anio <= 2024 ? config.montoHistoricoAntes : config.montoHistoricoDesde;
      await prisma.gastoComun.create({
        data: { departamentoId, monto, periodo, estadoPago: "HISTORICO" },
      });
    }
  }

  return NextResponse.json({ ok: true });
}

const MESES_ES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

export async function PATCH(req: Request) {
  const { gastoIds, revertirId, metodoPago, codigoTransaccion } = await req.json();

  // Revertir pago individual
  if (revertirId !== undefined) {
    await prisma.$transaction([
      prisma.ingreso.deleteMany({
        where: { descripcion: { startsWith: `[HC-${revertirId}]` } },
      }),
      prisma.gastoComun.update({
        where: { id: revertirId },
        data: { estadoPago: "HISTORICO", fechaPago: null },
      }),
    ]);
    return NextResponse.json({ ok: true });
  }

  // Pago múltiple
  if (!Array.isArray(gastoIds) || gastoIds.length === 0)
    return NextResponse.json({ error: "Sin gastos seleccionados" }, { status: 400 });

  const gastos = await prisma.gastoComun.findMany({
    where: { id: { in: gastoIds }, estadoPago: "HISTORICO" },
    include: { departamento: true },
  });

  const metodo = metodoPago === "EFECTIVO" ? "EFECTIVO" : "TRANSFERENCIA";
  const codigo = metodo === "TRANSFERENCIA" ? (codigoTransaccion ?? null) : null;
  const ahora = new Date();
  await prisma.$transaction([
    ...gastos.map((g) => {
      const p = new Date(g.periodo);
      const periodoStr = `${MESES_ES[p.getUTCMonth()]} ${p.getUTCFullYear()}`;
      return prisma.ingreso.create({
        data: {
          descripcion: `[HC-${g.id}] Pago deuda histórica · Dpto ${g.departamento.numero} · ${periodoStr}`,
          monto: g.monto,
          fecha: ahora,
          metodoPago: metodo,
          codigoTransaccion: codigo,
        },
      });
    }),
    ...gastos.map((g) =>
      prisma.gastoComun.update({
        where: { id: g.id },
        data: { estadoPago: "HISTORICO_PAGADO", fechaPago: ahora, metodoPago: metodo, codigoTransaccion: codigo },
      })
    ),
  ]);

  return NextResponse.json({ ok: true, pagados: gastos.length });
}

export async function DELETE(req: Request) {
  const { departamentoId } = await req.json();

  if (!departamentoId || typeof departamentoId !== "number") {
    return NextResponse.json({ error: "departamentoId requerido" }, { status: 400 });
  }

  await prisma.gastoComun.deleteMany({
    where: { departamentoId, estadoPago: { in: ["HISTORICO", "HISTORICO_PAGADO"] } },
  });

  return NextResponse.json({ ok: true });
}