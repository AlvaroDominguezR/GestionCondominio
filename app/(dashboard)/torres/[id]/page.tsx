import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import TorreDetalle from "./TorreDetalle";

export default async function TorreDetallePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const torre = await prisma.torre.findUnique({
    where: { id: Number(id) },
    include: {
      departamentos: {
        orderBy: { id: "asc" },
        include: {
          dueno: true,
          residentes: {
            include: {
              vehiculos: true,
            },
          },
        },
      },
    },
  });

  if (!torre) notFound();

  return <TorreDetalle torre={torre} />;
}