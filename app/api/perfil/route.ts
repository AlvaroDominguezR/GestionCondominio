import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";

export async function GET() {
  let perfil = await prisma.perfilCondominio.findFirst();
  if (!perfil) {
    perfil = await prisma.perfilCondominio.create({
      data: {},
    });
  }
  return NextResponse.json({ perfil });
}

export async function POST(req: Request) {
  const { nombre, direccion, comuna, ciudad, telefono, email } = await req.json();

  let perfil = await prisma.perfilCondominio.findFirst();
  if (perfil) {
    perfil = await prisma.perfilCondominio.update({
      where: { id: perfil.id },
      data: { nombre, direccion, comuna, ciudad, telefono, email },
    });
  } else {
    perfil = await prisma.perfilCondominio.create({
      data: { nombre, direccion, comuna, ciudad, telefono, email },
    });
  }

  return NextResponse.json({ ok: true, perfil });
}