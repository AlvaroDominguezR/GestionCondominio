"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Users, UserCheck, Car, FileDown } from "lucide-react";

type Residente = {
  id: number;
  nombre: string;
  rut: string;
  telefono: string | null;
  esJefeHogar: boolean;
  vehiculos: { id: number }[];
  departamento: {
    id: number;
    numero: string;
    tipoOcupacion: string;
    torre: { nombre: string; sector: string };
  };
};

type Stats = {
  total: number;
  conJefe: number;
  conVehiculo: number;
};

const FILTROS = [
  { key: "todos",          label: "Todos" },
  { key: "jefe",           label: "Jefe de hogar" },
  { key: "dueno",          label: "Residentes Propietarios" },
  { key: "arrendatario",   label: "Arrendatarios" },
  { key: "vehiculo",       label: "Con vehículo" },
];

export default function HabitantesPage() {
  const [residentes, setResidentes] = useState<Residente[]>([]);
  const [stats, setStats]           = useState<Stats>({ total: 0, conJefe: 0, conVehiculo: 0 });
  const [q, setQ]                   = useState("");
  const [filtro, setFiltro]         = useState("todos");
  const [cargando, setCargando]     = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({ q, filtro });
    const res  = await fetch(`/api/habitantes?${params}`);
    const data = await res.json();
    setResidentes(data.residentes);
    setStats({ total: data.total, conJefe: data.conJefe, conVehiculo: data.conVehiculo });
    setCargando(false);
  }, [q, filtro]);

  useEffect(() => {
    const timeout = setTimeout(cargar, 200);
    return () => clearTimeout(timeout);
  }, [cargar]);

  // Función
    function handleExportarExcel() {
      window.open("/api/exportar/residentes", "_blank");
  }

  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Habitantes</h1>
          <p className="text-sm text-gray-500 mt-1">Listado de habitantes del condominio</p>
        </div>
        <button onClick={handleExportarExcel}
          className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
          <FileDown className="w-4 h-4" />Excel
        </button>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center shrink-0">
            <Users className="w-4 h-4 text-blue-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Total habitantes</p>
            <p className="text-lg font-bold text-gray-900">{stats.total}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center shrink-0">
            <UserCheck className="w-4 h-4 text-green-600" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Jefes de hogar</p>
            <p className="text-lg font-bold text-gray-900">{stats.conJefe}</p>
          </div>
        </div>
        <div className="bg-white border border-gray-200 rounded-lg p-3 flex items-center gap-3">
          <div className="w-8 h-8 bg-orange-50 rounded-lg flex items-center justify-center shrink-0">
            <Car className="w-4 h-4 text-orange-500" />
          </div>
          <div>
            <p className="text-xs text-gray-400">Con vehículo</p>
            <p className="text-lg font-bold text-gray-900">{stats.conVehiculo}</p>
          </div>
        </div>
      </div>

      {/* Búsqueda + filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por nombre, RUT o teléfono..."
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {FILTROS.map((f) => (
            <button
              key={f.key}
              onClick={() => setFiltro(f.key)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                ${filtro === f.key
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100">
          <p className="text-sm text-gray-500">
            {cargando ? "Cargando..." : `${residentes.length} resultado${residentes.length !== 1 ? "s" : ""}`}
          </p>
        </div>

        {!cargando && residentes.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">
            No se encontraron residentes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Nombre</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">RUT</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Teléfono</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Departamento</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Tipo</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Jefe hogar</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Vehículos</th>
                </tr>
              </thead>
              <tbody>
                {residentes.map((r, i) => (
                  <tr
                    key={r.id}
                    className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}
                  >
                    <td className="px-6 py-4 font-medium text-gray-900">{r.nombre}</td>
                    <td className="px-6 py-4 text-gray-500">{r.rut}</td>
                    <td className="px-6 py-4 text-gray-500">{r.telefono ?? "—"}</td>
                    <td className="px-6 py-4">
                      <Link
                        href={`/departamentos/${r.departamento.id}`}
                        className="text-blue-600 hover:text-blue-800 transition-colors"
                      >
                        {r.departamento.numero || "Sin número"} · {r.departamento.torre.nombre}
                      </Link>
                    </td>
                    <td className="px-6 py-4">
                      {r.esJefeHogar ? (
                        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full
                          ${r.departamento.tipoOcupacion === "DUENO"
                            ? "bg-blue-50 text-blue-700"
                            : "bg-orange-50 text-orange-700"
                          }`}>
                          {r.departamento.tipoOcupacion === "DUENO" ? "Dueño" : "Arrendatario"}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">Residente</span>
                      )}
                    </td>
                    <td className="px-6 py-4">
                      {r.esJefeHogar
                        ? <span className="text-xs bg-gray-900 text-white px-2.5 py-1 rounded-full">Sí</span>
                        : <span className="text-xs text-gray-400">—</span>
                      }
                    </td>
                    <td className="px-6 py-4">
                      {r.vehiculos.length > 0 ? (
                        <div className="flex items-center gap-1.5 text-gray-500">
                          <Car className="w-3.5 h-3.5" />
                          <span className="text-xs">{r.vehiculos.length}</span>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
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