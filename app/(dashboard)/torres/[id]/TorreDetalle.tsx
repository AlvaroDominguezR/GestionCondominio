"use client";

import Link from "next/link";
import { useState } from "react";
import { CheckCircle2, Circle, Pencil, Check, X, Car } from "lucide-react";
import { actualizarNumeroDepartamento } from "./actions";

type Vehiculo = { id: number; patente: string; tipo: string };

type Residente = {
  id: number;
  nombre: string;
  esJefeHogar: boolean;
  vehiculos: Vehiculo[];
};

type Depto = {
  id: number;
  numero: string;
  tipoOcupacion: string;
  dueno: { nombre: string } | null;
  residentes: Residente[];
};

type Torre = {
  id: number;
  nombre: string;
  sector: string;
  departamentos: Depto[];
};

function DeptoCard({ depto }: { depto: Depto }) {
  const [editando, setEditando] = useState(false);
  const [numero, setNumero]     = useState(depto.numero);
  const [guardando, setGuardando] = useState(false);

  const jefeHogar    = depto.residentes.find((r) => r.esJefeHogar);
  const totalVehiculos = depto.residentes.reduce((acc, r) => acc + r.vehiculos.length, 0);
  const tieneInfo    = numero !== "" || depto.dueno || depto.residentes.length > 0;

  async function guardar() {
    setGuardando(true);
    await actualizarNumeroDepartamento(depto.id, numero);
    setEditando(false);
    setGuardando(false);
  }

  function cancelar() {
    setNumero(depto.numero);
    setEditando(false);
  }

  return (
    <div className={`bg-white border rounded-xl p-4 flex flex-col gap-3 transition-all hover:shadow-sm
      ${tieneInfo ? "border-gray-200" : "border-dashed border-gray-300"}`}>

      {/* Header: número editable + estado */}
      <div className="flex items-center justify-between">
        {editando ? (
          <div className="flex items-center gap-1 flex-1">
            <input
              autoFocus
              type="text"
              value={numero}
              onChange={(e) => setNumero(e.target.value)}
              placeholder="Ej: 101"
              maxLength={5}
              className="w-full border border-blue-400 rounded-md px-2 py-1 text-sm font-bold text-gray-900 focus:outline-none"
            />
            <button onClick={guardar} disabled={guardando} className="p-1 text-green-600 hover:text-green-800">
              <Check className="w-4 h-4" />
            </button>
            <button onClick={cancelar} className="p-1 text-red-400 hover:text-red-600">
              <X className="w-4 h-4" />
            </button>
          </div>
        ) : (
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold text-gray-900">
              {numero ? `N° ${numero}` : "Sin número"}
            </span>
            <button onClick={() => setEditando(true)} className="p-0.5 text-gray-300 hover:text-gray-600">
              <Pencil className="w-3 h-3" />
            </button>
          </div>
        )}
        {!editando && (
          tieneInfo
            ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
            : <Circle className="w-4 h-4 text-gray-300 shrink-0" />
        )}
      </div>

      {/* Info */}
      <div className="space-y-2">
        {/* Tipo ocupación */}
        <span className={`inline-block text-xs px-2 py-0.5 rounded-full font-medium
          ${depto.tipoOcupacion === "DUENO" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}`}>
          {depto.tipoOcupacion === "DUENO" ? "Dueño" : "Arrendatario"}
        </span>

        {/* Jefe de hogar */}
        {jefeHogar && (
          <div className="flex items-center gap-1.5">
            <span className="text-xs border border-gray-200 text-gray-600 px-2 py-0.5 rounded-full font-medium shrink-0">
              Jefe hogar
            </span>
            <span className="text-xs text-gray-600 truncate">{jefeHogar.nombre}</span>
          </div>
        )}

        {/* Residentes + vehículos */}
        <div className="flex items-center justify-between">
          <span className="text-xs text-gray-400">
            {depto.residentes.length} residente{depto.residentes.length !== 1 ? "s" : ""}
          </span>
          {totalVehiculos > 0 && (
            <div className="flex items-center gap-1 text-gray-400">
              <Car className="w-3 h-3" />
              <span className="text-xs">{totalVehiculos}</span>
            </div>
          )}
        </div>
      </div>

      {/* Link */}
      <Link
        href={`/departamentos/${depto.id}`}
        className="text-xs text-blue-500 hover:text-blue-700 transition-colors mt-auto"
      >
        {depto.residentes.length > 0 ? "Ver departamento →" : "Completar información →"}
      </Link>
    </div>
  );
}

export default function TorreDetalle({ torre }: { torre: Torre }) {
  const pisos = [1, 2, 3, 4];
  const deptosPorPiso = 4;
  const deptoOcupados = torre.departamentos.filter(
    (d) => d.numero !== "" || d.dueno || d.residentes.length > 0
  ).length;

  return (
    <div className="space-y-8">
      <div>
        <Link href="/torres" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Volver a torres
        </Link>
        <div className="mt-3 flex items-center gap-3">
          <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-white text-sm
            ${torre.sector === "A" ? "bg-blue-600" : "bg-green-600"}`}>
            {torre.sector}
          </div>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">{torre.nombre}</h1>
            <p className="text-sm text-gray-500">
              {deptoOcupados} de {torre.departamentos.length} departamentos con información
            </p>
          </div>
        </div>
      </div>

      <div className="space-y-6">
        {pisos.map((piso) => {
          const inicio = (piso - 1) * deptosPorPiso;
          const deptosPiso = torre.departamentos.slice(inicio, inicio + deptosPorPiso);
          return (
            <div key={piso}>
              <div className="flex items-center gap-3 mb-3">
                <span className="text-sm font-semibold text-gray-700">Piso {piso}</span>
                <div className="flex-1 h-px bg-gray-100" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {deptosPiso.map((depto) => (
                  <DeptoCard key={depto.id} depto={depto} />
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}