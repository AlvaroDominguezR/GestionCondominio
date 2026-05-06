import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { descripcion, monto, fecha } = await req.json();
  if (!descripcion || !monto) {
    return NextResponse.json({ error: "Descripción y monto son obligatorios" }, { status: 400 });
  }
  const ingreso = await prisma.ingreso.create({
    data: { descripcion, monto: parseFloat(monto), fecha: fecha ? new Date(fecha + "T12:00:00") : new Date() },
  });
  return NextResponse.json({ ok: true, ingreso });
}