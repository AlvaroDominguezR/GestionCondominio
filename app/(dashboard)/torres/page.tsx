import { prisma } from "@/lib/prisma";
import Link from "next/link";
import { Building2, ChevronRight } from "lucide-react";
import { eliminarTorre } from "./actions";
 
export default async function TorresPage() {
  const torres = await prisma.torre.findMany({
    orderBy: [{ sector: "asc" }, { nombre: "asc" }],
    include: {
      _count: { select: { departamentos: true } },
    },
  });
 
  const sectorA = torres.filter((t) => t.sector === "A");
  const sectorB = torres.filter((t) => t.sector === "B");
 
  const SectorCard = ({
    sector,
    lista,
    color,
  }: {
    sector: string;
    lista: typeof torres;
    color: string;
  }) => (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      {/* Header sector */}
      <div className={`px-6 py-4 border-b border-gray-100 flex items-center gap-3`}>
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">{sector}</span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Sector {sector}</h2>
          <p className="text-xs text-gray-400">{lista.length} de 9 torres registradas</p>
        </div>
      </div>
 
      {/* Lista de torres */}
      {lista.length === 0 ? (
        <div className="px-6 py-10 text-center text-sm text-gray-400">
          No hay torres en este sector.
        </div>
      ) : (
        <div className="divide-y divide-gray-100">
          {lista.map((torre) => (
            <div key={torre.id} className="px-6 py-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <Building2 className="w-4 h-4 text-gray-400" />
                <div>
                  <p className="text-sm font-medium text-gray-900">{torre.nombre}</p>
                  <p className="text-xs text-gray-400">
                    {torre._count.departamentos} departamentos
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-4">
                <Link
                  href={`/torres/${torre.id}`}
                  className="text-sm text-blue-600 hover:text-blue-800 flex items-center gap-1 transition-colors"
                >
                  Ver <ChevronRight className="w-3 h-3" />
                </Link>
                <form
                  action={async () => {
                    "use server";
                    await eliminarTorre(torre.id);
                  }}
                >
                  <button
                    type="submit"
                    className="text-xs text-red-400 hover:text-red-600 transition-colors"
                  >
                    Eliminar
                  </button>
                </form>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
 
  return (
    <div className="space-y-8">
 
      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Torres</h1>
          <p className="text-sm text-gray-500 mt-1">
            {torres.length} de 18 torres registradas
          </p>
        </div>
        {torres.length < 18 && (
          <Link
            href="/torres/nueva"
            className="bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 transition-colors"
          >
            + Nueva torre
          </Link>
        )}
      </div>
 
      {/* Sectores */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectorCard sector="A" lista={sectorA} color="bg-blue-600" />
        <SectorCard sector="B" lista={sectorB} color="bg-green-600" />
      </div>
 
    </div>
  );
}