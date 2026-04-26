import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const depto = await prisma.departamento.findUnique({
    where: { id: Number(id) },
    include: {
      torre: true,
      dueno: true,
      residentes: {
        orderBy: { id: "asc" },
        include: { vehiculos: true },
      },
    },
  });

  if (!depto) return NextResponse.json({ error: "No encontrado" }, { status: 404 });

  return NextResponse.json(depto);
}