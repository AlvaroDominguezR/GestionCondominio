import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const body = await req.json().catch(() => ({}));
  const metodo = body.metodoPago === "EFECTIVO" ? "EFECTIVO" : "TRANSFERENCIA";

  await prisma.gastoComun.update({
    where: { id: Number(id) },
    data: {
      estadoPago: "PAGADO",
      fechaPago:  new Date(),
      metodoPago: metodo,
    },
  });

  return NextResponse.json({ ok: true });
}