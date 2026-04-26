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

  // Obtener gastos pendientes o atrasados del departamento
  const gastosPendientes = await prisma.gastoComun.findMany({
    where: {
      departamentoId,
      estadoPago: { in: ["PENDIENTE", "ATRASADO"] },
    },
    orderBy: { periodo: "asc" },
  });

  // Generar lista de meses desde hace 12 meses hasta 6 meses adelante
  const meses = [];
  const hoy = new Date();
  for (let i = -12; i <= 6; i++) {
    const fecha = new Date(hoy.getFullYear(), hoy.getMonth() + i, 1);
    const key = `${fecha.getFullYear()}-${String(fecha.getMonth() + 1).padStart(2, "0")}`;
    const gastoExistente = gastosPendientes.find(
      (g) => new Date(g.periodo).getFullYear() === fecha.getFullYear() &&
              new Date(g.periodo).getMonth() === fecha.getMonth()
    );
    meses.push({
      key,
      label: fecha.toLocaleDateString("es-CL", { month: "long", year: "numeric" }),
      gastoId: gastoExistente?.id ?? null,
      estadoPago: gastoExistente?.estadoPago ?? null,
      monto: gastoExistente?.monto ?? config.montoMensual,
    });
  }

  // Filtrar solo los que no están pagados
  const disponibles = meses.filter((m) => m.estadoPago !== "PAGADO");

  return NextResponse.json({ meses: disponibles, montoMensual: config.montoMensual });
}

export async function POST(req: Request) {
  const { departamentoId, mesesSeleccionados } = await req.json();
  // mesesSeleccionados: Array<{ key: string, gastoId: number | null }>

  const config = await prisma.configuracion.findFirst();
  if (!config) return NextResponse.json({ error: "Sin configuración" }, { status: 400 });

  const fechaPago = new Date();

  for (const mes of mesesSeleccionados) {
    const [year, month] = mes.key.split("-").map(Number);
    const periodo = new Date(year, month - 1, 1);

    if (mes.gastoId) {
      // Actualizar gasto existente
      await prisma.gastoComun.update({
        where: { id: mes.gastoId },
        data: { estadoPago: "PAGADO", fechaPago },
      });
    } else {
      // Crear nuevo gasto y marcarlo pagado directamente
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

  return NextResponse.json({ ok: true });
}