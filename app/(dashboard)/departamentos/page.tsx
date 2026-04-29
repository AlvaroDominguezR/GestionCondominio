"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Search, Users, CheckCircle2, Clock, AlertCircle, UserCheck } from "lucide-react";

type Departamento = {
  id: number;
  numero: string;
  tipoOcupacion: string;
  torre: { nombre: string; sector: string };
  dueno: { nombre: string } | null;
  _count: { residentes: number };
  gastosComunes: { estadoPago: string }[];
};

const estadoGastoConfig: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  PAGADO:    { icon: <CheckCircle2 className="w-3.5 h-3.5" />, label: "Al día",    color: "text-green-600 bg-green-50" },
  PENDIENTE: { icon: <Clock className="w-3.5 h-3.5" />,        label: "Pendiente", color: "text-yellow-600 bg-yellow-50" },
  ATRASADO:  { icon: <AlertCircle className="w-3.5 h-3.5" />,  label: "Atrasado",  color: "text-red-600 bg-red-50" },
};

export default function DepartamentosPage() {
  const [deptos, setDeptos]     = useState<Departamento[]>([]);
  const [q, setQ]               = useState("");
  const [sector, setSector]     = useState("todos");
  const [cargando, setCargando] = useState(true);

  const cargar = useCallback(async () => {
    setCargando(true);
    const params = new URLSearchParams({ q, sector });
    const res  = await fetch(`/api/departamentos-lista?${params}`);
    const data = await res.json();
    setDeptos(data.departamentos ?? []);
    setCargando(false);
  }, [q, sector]);

  useEffect(() => {
    const timeout = setTimeout(cargar, 200);
    return () => clearTimeout(timeout);
  }, [cargar]);

  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Departamentos</h1>
        <p className="text-sm text-gray-500 mt-1">
          {cargando ? "..." : `${deptos.length} departamento${deptos.length !== 1 ? "s" : ""} ocupado${deptos.length !== 1 ? "s" : ""}`}
        </p>
      </div>

      {/* Búsqueda + filtros */}
      <div className="space-y-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <input
            type="text"
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Buscar por número de departamento..."
            className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
          />
        </div>
        <div className="flex gap-2">
          {["todos", "A", "B"].map((s) => (
            <button key={s}
              onClick={() => setSector(s)}
              className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                ${sector === s
                  ? "bg-gray-900 text-white border-gray-900"
                  : "bg-white text-gray-500 border-gray-200 hover:border-gray-400"
                }`}>
              {s === "todos" ? "Todos" : `Sector ${s}`}
            </button>
          ))}
        </div>
      </div>

      {/* Grid de tarjetas */}
      {!cargando && deptos.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-xl px-6 py-16 text-center text-sm text-gray-400">
          No hay departamentos ocupados con ese criterio.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {deptos.map((d) => {
            const gastoMes    = d.gastosComunes[0];
            const estadoGasto = gastoMes ? estadoGastoConfig[gastoMes.estadoPago] : null;

            return (
              <Link key={d.id} href={`/departamentos/${d.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all space-y-4">

                {/* Header */}
                <div className="flex items-start justify-between">
                  <div>
                    <p className="font-bold text-gray-900">Depto. {d.numero || "Sin número"}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{d.torre.nombre} · Sector {d.torre.sector}</p>
                  </div>
                  <span className={`text-xs font-medium px-2.5 py-1 rounded-full
                    ${d.tipoOcupacion === "DUENO" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}`}>
                    {d.tipoOcupacion === "DUENO" ? "Dueño" : "Arrendatario"}
                  </span>
                </div>

                {/* Info */}
                <div className="space-y-2">
                  {/* Dueño */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <UserCheck className="w-3.5 h-3.5 text-gray-400" />
                    <span>{d.dueno?.nombre ?? "Sin dueño asignado"}</span>
                  </div>

                  {/* Habitantes */}
                  <div className="flex items-center gap-2 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5 text-gray-400" />
                    <span>{d._count.residentes} habitante{d._count.residentes !== 1 ? "s" : ""}</span>
                  </div>
                </div>

                {/* Estado gasto común */}
                <div className="pt-2 border-t border-gray-100">
                  {estadoGasto ? (
                    <div className={`flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg w-fit ${estadoGasto.color}`}>
                      {estadoGasto.icon}
                      <span>Gasto común: {estadoGasto.label}</span>
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400">Sin cobro generado este mes</p>
                  )}
                </div>

              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}