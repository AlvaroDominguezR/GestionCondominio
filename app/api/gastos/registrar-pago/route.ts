import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const departamentoId = Number(searchParams.get("departamentoId"));

  if (!departamentoId) {
    return NextResponse.json({ error: "Departamento requerido" }, { status: 400 });
  }

  const config = await prisma.configuracion.findFirst();
  if (!config || config.montoMensual === 0) {
    return NextResponse.json({ error: "Configura el monto mensual primero" }, { status: 400 });
  }

  // Traer TODOS los gastos del departamento (pagados, pendientes y atrasados)
  const todosLosGastos = await prisma.gastoComun.findMany({
    where: { departamentoId },
    orderBy: { periodo: "asc" },
  });

  const meses = [];
  const hoy = new Date();

  for (let i = -12; i <= 6; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;

    const gastoExistente = todosLosGastos.find(
      (g) =>
        new Date(g.periodo).getFullYear() === fecha.getFullYear() &&
        new Date(g.periodo).getMonth() === fecha.getMonth()
    );

    // Si ya está pagado, no lo incluimos en la lista
    if (gastoExistente?.estadoPago === "PAGADO") continue;

    meses.push({
      key,
      label: fecha.toLocaleDateString("es-CL", { month: "long", year: "numeric" }),
      gastoId: gastoExistente?.id ?? null,
      estadoPago: gastoExistente?.estadoPago ?? null,
      monto: gastoExistente?.monto ?? config.montoMensual,
    });
  }

  return NextResponse.json({ meses, montoMensual: config.montoMensual });
}

export async function POST(req: Request) {
  const { departamentoId, mesesSeleccionados } = await req.json();

  const config = await prisma.configuracion.findFirst();
  if (!config) return NextResponse.json({ error: "Sin configuración" }, { status: 400 });

  const fechaPago = new Date();

  for (const mes of mesesSeleccionados) {
    const [year, month] = mes.key.split("-").map(Number);
    const periodo = new Date(year, month - 1, 1);

    if (mes.gastoId) {
      // Verificar que no esté ya pagado antes de actualizar
      const gasto = await prisma.gastoComun.findUnique({ where: { id: mes.gastoId } });
      if (gasto && gasto.estadoPago !== "PAGADO") {
        await prisma.gastoComun.update({
          where: { id: mes.gastoId },
          data: { estadoPago: "PAGADO", fechaPago },
        });
      }
    } else {
      // Verificar que no exista ya para ese mes
      const existente = await prisma.gastoComun.findFirst({
        where: { departamentoId, periodo },
      });

      if (!existente) {
        await prisma.gastoComun.create({
          data: {
            departamentoId,
            monto: config.montoMensual,
            periodo,
            estadoPago: "PAGADO",
            fechaPago,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true });
}