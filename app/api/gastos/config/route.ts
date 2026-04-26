import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { montoMensual } = await req.json();

  const config = await prisma.configuracion.findFirst();
  if (config) {
    await prisma.configuracion.update({ where: { id: config.id }, data: { montoMensual } });
  } else {
    await prisma.configuracion.create({ data: { montoMensual } });
  }

  return NextResponse.json({ ok: true });
}