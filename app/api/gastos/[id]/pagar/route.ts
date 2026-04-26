import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  await prisma.gastoComun.update({
    where: { id: Number(id) },
    data: {
      estadoPago: "PAGADO",
      fechaPago:  new Date(),
    },
  });

  return NextResponse.json({ ok: true });
}