import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

const MESES_ABREV = ["Ene","Feb","Mar","Abr","May","Jun","Jul","Ago","Sep","Oct","Nov","Dic"];

export async function GET() {
  // Traer suficientes registros para que al agrupar queden ~15 sesiones
  const pagos = await prisma.gastoComun.findMany({
    where: { estadoPago: "PAGADO" },
    orderBy: { fechaPago: "desc" },
    take: 80,
    include: { departamento: { include: { torre: true } } },
  });

  // Agrupar por (departamentoId + metodoPago + fechaPago exacto) = una sesión de pago
  const mapa: Record<string, {
    key: string;
    deptoId: number;
    numero: string;
    torre: string;
    mesesPorAnio: Record<number, string[]>;
    totalMonto: number;
    fechaPago: string | null;
    metodoPago: string | null;
  }> = {};

  for (const g of pagos) {
    const metodo   = (g as any).metodoPago ?? "TRANSFERENCIA";
    const fechaISO = g.fechaPago ? g.fechaPago.toISOString() : "sin-fecha";
    const key      = `${g.departamentoId}-${metodo}-${fechaISO}`;

    const fecha  = new Date(g.periodo);
    const anio   = fecha.getUTCFullYear();
    const mesIdx = fecha.getUTCMonth();

    if (!mapa[key]) {
      mapa[key] = {
        key,
        deptoId:      g.departamentoId,
        numero:       g.departamento.numero || "S/N",
        torre:        g.departamento.torre.nombre,
        mesesPorAnio: {},
        totalMonto:   0,
        fechaPago:    g.fechaPago?.toISOString() ?? null,
        metodoPago:   metodo,
      };
    }

    if (!mapa[key].mesesPorAnio[anio]) mapa[key].mesesPorAnio[anio] = [];
    mapa[key].mesesPorAnio[anio].push(MESES_ABREV[mesIdx]);
    mapa[key].totalMonto += g.monto;
  }

  const pagosAgrupados = Object.values(mapa)
    .map((item) => {
      const partes = Object.entries(item.mesesPorAnio)
        .sort(([a], [b]) => Number(a) - Number(b))
        .map(([anio, meses]) => {
          const sorted = [...meses].sort((a, b) => MESES_ABREV.indexOf(a) - MESES_ABREV.indexOf(b));
          return `${anio}: ${sorted.join(", ")}`;
        });
      return {
        key:        item.key,
        deptoId:    item.deptoId,
        numero:     item.numero,
        torre:      item.torre,
        mesesLabel: partes.join(" / "),
        totalMonto: item.totalMonto,
        fechaPago:  item.fechaPago,
        metodoPago: item.metodoPago,
      };
    })
    .sort((a, b) => {
      if (!a.fechaPago) return 1;
      if (!b.fechaPago) return -1;
      return new Date(b.fechaPago).getTime() - new Date(a.fechaPago).getTime();
    })
    .slice(0, 15);

  return NextResponse.json({ pagos: pagosAgrupados }, { headers: { "Cache-Control": "no-store" } });
}
