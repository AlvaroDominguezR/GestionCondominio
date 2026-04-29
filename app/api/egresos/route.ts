import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { descripcion, monto, fecha } = await req.json();
  if (!descripcion || !monto) {
    return NextResponse.json({ error: "Descripción y monto son obligatorios" }, { status: 400 });
  }
  const egreso = await prisma.egreso.create({
    data: { descripcion, monto: parseFloat(monto), fecha: fecha ? new Date(fecha) : new Date() },
  });
  return NextResponse.json({ ok: true, egreso });
}