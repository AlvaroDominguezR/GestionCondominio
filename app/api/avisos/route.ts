import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  const avisos = await prisma.aviso.findMany({
    orderBy: { fecha: "asc" },
  });
  return NextResponse.json({ avisos });
}

export async function POST(req: Request) {
  const { titulo, descripcion, fecha } = await req.json();
  if (!titulo || !fecha) {
    return NextResponse.json({ error: "Título y fecha son obligatorios" }, { status: 400 });
  }
  const aviso = await prisma.aviso.create({
    data: { titulo, descripcion: descripcion || null, fecha: new Date(fecha + "T12:00:00") },
  });
  return NextResponse.json({ ok: true, aviso });
}

export async function DELETE(req: Request) {
  const { id } = await req.json();
  await prisma.aviso.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}