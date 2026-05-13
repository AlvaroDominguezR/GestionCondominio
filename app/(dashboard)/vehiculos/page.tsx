"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Car, FileDown, Motorbike, Truck, Bus, Van, Icon } from "lucide-react";

type Vehiculo = {
  id: number;
  patente: string;
  tipo: string;
  residente: {
    id: number;
    nombre: string;
    departamento: {
      id: number;
      numero: string;
      torre: { nombre: string; sector: string };
    };
  };
};

type Stats = {
  total: number;
  autos: number;
  motos: number;
  camionetas: number;
  furgones: number;
  otros: number;
};

const FILTROS = [
  { key: "todos",     label: "Todos" },
  { key: "AUTO",      label: "Autos" },
  { key: "MOTO",      label: "Motos" },
  { key: "CAMIONETA", label: "Camionetas" },
  { key: "FURGON",    label: "Furgones" },
  { key: "OTRO",      label: "Otros" },
];

const TIPO_LABEL: Record<string, string> = {
  AUTO: "Auto", MOTO: "Moto", CAMIONETA: "Camioneta", FURGON: "Furgón", OTRO: "Otro",
};

export default function VehiculosPage() {
  const [vehiculos, setVehiculos] = useState<Vehiculo[]>([]);
  const [stats, setStats]         = useState<Stats>({ total: 0, autos: 0, motos: 0, camionetas: 0, furgones: 0, otros: 0 });
  const [q, setQ]                 = useState("");
  const [tipo, setTipo]           = useState("todos");
  const [cargando, setCargando]   = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({ q, tipo });
    const res  = await fetch(`/api/vehiculos?${params}`);
    const data = await res.json();
    setVehiculos(data.vehiculos ?? []);
    setStats(data.stats ?? { total: 0, autos: 0, motos: 0, camionetas: 0, furgones: 0, otros: 0 });
    setCargando(false);
  }, [q, tipo]);

  useEffect(() => {
    const timeout = setTimeout(cargar, 200);
    return () => clearTimeout(timeout);
  }, [cargar]);

  function handleExportarExcel() {
    window.open("/api/exportar/vehiculos", "_blank");
  }

  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Vehículos</h1>
          <p className="text-sm text-gray-500 mt-1">Registro de vehículos del condominio</p>
        </div>
        <button onClick={handleExportarExcel}
          className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
          <FileDown className="w-4 h-4" />Excel
        </button>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        {[
          { label: "Total",      value: stats.total,      color: "text-gray-900",   bg: "bg-gray-50", icon: Car },
          { label: "Autos",      value: stats.autos,      color: "text-blue-700",   bg: "bg-blue-50", icon: Car },
          { label: "Motos",      value: stats.motos,      color: "text-purple-700", bg: "bg-purple-50", icon: Motorbike },
          { label: "Camionetas", value: stats.camionetas, color: "text-green-700",  bg: "bg-green-50", icon: Truck },
          { label: "Furgones",   value: stats.furgones,   color: "text-orange-700", bg: "bg-orange-50", icon: Bus },
          { label: "Otros",      value: stats.otros,      color: "text-gray-600",   bg: "bg-gray-50", icon: Van },
        ].map(({ label, value, color, bg, icon: Icon }) => (
          <div key={label} className="bg-white border border-gray-200 rounded-xl p-4 text-center">
            <div className={`w-8 h-8 ${bg} rounded-lg flex items-center justify-center mx-auto mb-2`}>
              <Icon className={`w-6 h-6 ${color}`} />
            </div>
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-gray-400 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      {/* Búsqueda + filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por patente o propietario..."
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map((f) => (
            <button key={f.key} onClick={() => setTipo(f.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                ${tipo === f.key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}>
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-500">
            {cargando ? "Cargando..." : `${vehiculos.length} resultado${vehiculos.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {!cargando && vehiculos.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">
            No se encontraron vehículos.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Patente</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Propietario</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Departamento</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Torre</th>
                </tr>
              </thead>
              <tbody>
                {vehiculos.map((v, i) => (
                  <tr key={v.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="px-6 py-4 font-mono font-semibold text-gray-900">{v.patente}</td>
                    <td className="px-6 py-4">
                      <span className="text-xs font-medium bg-gray-100 text-gray-700 px-2.5 py-1 rounded-full">
                        {TIPO_LABEL[v.tipo] ?? v.tipo}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-gray-700">{v.residente.nombre}</td>
                    <td className="px-6 py-4">
                      <Link href={`/departamentos/${v.residente.departamento.id}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors">
                        {v.residente.departamento.numero || "Sin número"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{v.residente.departamento.torre.nombre}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

    </div>
  );
}