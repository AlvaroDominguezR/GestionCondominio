import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function POST(req: Request) {
  const { descripcion, monto, fecha, metodoPago, codigoTransaccion } = await req.json();
  if (!descripcion || !monto) {
    return NextResponse.json({ error: "Descripción y monto son obligatorios" }, { status: 400 });
  }
  const metodo = metodoPago === "EFECTIVO" ? "EFECTIVO" : "TRANSFERENCIA";
  const ingreso = await prisma.ingreso.create({
    data: {
      descripcion,
      monto: parseFloat(monto),
      fecha: fecha ? new Date(fecha + "T12:00:00") : new Date(),
      metodoPago: metodo,
      codigoTransaccion: metodo === "TRANSFERENCIA" ? (codigoTransaccion ?? null) : null,
    },
  });
  return NextResponse.json({ ok: true, ingreso });
}