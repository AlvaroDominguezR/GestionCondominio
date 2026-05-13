"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { Building2, ChevronRight } from "lucide-react";
import { eliminarTorre } from "./actions";

type Torre = {
  id: number;
  nombre: string;
  sector: string;
  _count: { departamentos: number };
  departamentosOcupados: number;
};

function SectorCard({ sector, lista, color, onEliminar }: {
  sector: string;
  lista: Torre[];
  color: string;
  onEliminar: () => void;
}) {
  return (
    <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
      <div className="px-6 py-4 border-b border-gray-100 flex items-center gap-3">
        <div className={`w-8 h-8 rounded-lg ${color} flex items-center justify-center`}>
          <span className="text-white font-bold text-sm">{sector}</span>
        </div>
        <div>
          <h2 className="font-semibold text-gray-900">Sector {sector}</h2>
          <p className="text-xs text-gray-400">{lista.length} de 9 torres registradas</p>
        </div>
      </div>

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
                    {torre.departamentosOcupados} de {torre._count.departamentos} departamentos ocupados
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
                <button
                  type="button"
                  onClick={async () => {
                    if (confirm(`¿Estás seguro de eliminar ${torre.nombre}? Se eliminarán todos sus departamentos y la información asociada.`)) {
                      await eliminarTorre(torre.id);
                      onEliminar();
                    }
                  }}
                  className="text-xs text-red-400 hover:text-red-600 transition-colors"
                >
                  Eliminar
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

export default function TorresPage() {
  const [torres, setTorres] = useState<Torre[]>([]);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    fetch("/api/torres-lista")
      .then((r) => r.json())
      .then((data) => setTorres(data.torres ?? []));
  }, [refresh]);

  const sectorA = torres.filter((t) => t.sector === "A");
  const sectorB = torres.filter((t) => t.sector === "B");

  return (
    <div className="space-y-8">
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <SectorCard sector="A" lista={sectorA} color="bg-blue-600" onEliminar={() => setRefresh((n) => n + 1)} />
        <SectorCard sector="B" lista={sectorB} color="bg-green-600" onEliminar={() => setRefresh((n) => n + 1)} />
      </div>
    </div>
  );
}