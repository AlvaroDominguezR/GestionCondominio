import { prisma } from "@/lib/prisma";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";

export async function GET() {
  const residentes = await prisma.residente.findMany({
    include: {
      departamento: { include: { torre: true } },
    },
    orderBy: [
      { departamento: { torre: { sector: "asc" } } },
      { departamento: { torre: { nombre: "asc" } } },
      { departamento: { numero: "asc" } },
      { nombre: "asc" },
    ],
  });

  const data = residentes.map((r) => ({
    "Nombre":         r.nombre,
    "RUT":            r.rut,
    "Teléfono":       r.telefono ?? "—",
    "Departamento":   r.departamento.numero || "Sin número",
    "Torre":          r.departamento.torre.nombre,
    "Sector":         r.departamento.torre.sector,
    "Tipo ocupación": r.departamento.tipoOcupacion === "DUENO" ? "Dueño" : "Arrendatario",
    "Jefe de hogar":  r.esJefeHogar ? "Sí" : "No",
  }));

  const wb = XLSX.utils.book_new();
  const ws = XLSX.utils.json_to_sheet(data);

  // Ancho de columnas
  ws["!cols"] = [
    { wch: 30 }, { wch: 14 }, { wch: 16 },
    { wch: 14 }, { wch: 14 }, { wch: 10 },
    { wch: 16 }, { wch: 14 },
  ];

  XLSX.utils.book_append_sheet(wb, ws, "Residentes");

  const buffer = XLSX.write(wb, { type: "buffer", bookType: "xlsx" });

  return new NextResponse(buffer, {
    headers: {
      "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
      "Content-Disposition": `attachment; filename="residentes.xlsx"`,
    },
  });
}