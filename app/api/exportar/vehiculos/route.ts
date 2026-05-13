import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const vehiculos = await prisma.vehiculo.findMany({
    include: {
      residente: {
        include: {
          departamento: { include: { torre: true } },
        },
      },
    },
    orderBy: [
      { residente: { departamento: { torre: { sector: "asc" } } } },
      { residente: { departamento: { torre: { nombre: "asc" } } } },
      { residente: { departamento: { numero: "asc" } } },
      { residente: { nombre: "asc" } },
    ],
  });

  const TIPO_LABEL: Record<string, string> = {
    AUTO: "Auto", MOTO: "Moto", CAMIONETA: "Camioneta", FURGON: "Furgón", OTRO: "Otro",
  };

  const data = vehiculos.map((v) => ({
    "Patente":      v.patente,
    "Tipo":         TIPO_LABEL[v.tipo] ?? v.tipo,
    "Propietario":  v.residente.nombre,
    "RUT":          v.residente.rut,
    "Departamento": v.residente.departamento.numero || "Sin número",
    "Torre":        v.residente.departamento.torre.nombre,
    "Sector":       v.residente.departamento.torre.sector,
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  ws["!cols"] = [
    { wch: 12 }, { wch: 12 }, { wch: 30 },
    { wch: 14 }, { wch: 14 }, { wch: 14 }, { wch: 10 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Vehículos");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="vehiculos.xlsx"`,
    },
  });
}