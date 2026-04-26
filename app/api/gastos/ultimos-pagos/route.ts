import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const pagos = await prisma.gastoComun.findMany({
    where: { estadoPago: "PAGADO" },
    orderBy: { fechaPago: "desc" },
    take: 15,
    include: {
      departamento: { include: { torre: true } },
    },
  });

  return NextResponse.json({ pagos });
}