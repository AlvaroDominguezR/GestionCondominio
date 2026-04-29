"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { CheckCircle2, Clock, AlertCircle } from "lucide-react";

type GastoDetalle = {
  id: number;
  monto: number;
  periodo: string;
  estadoPago: string;
  fechaPago: string | null;
  mesesAtrasados: number;
  departamento: {
    id: number;
    numero: string;
    torre: { nombre: string; sector: string };
    dueno: { nombre: string; telefono: string | null } | null;
  };
};

function formatMes(periodo: string) {
  const [year, month] = periodo.split("-");
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${meses[parseInt(month) - 1]} ${year}`;
}

const CONFIG: Record<string, { label: string; icon: React.ReactNode; color: string; badgeColor: string }> = {
  PAGADO:    { label: "Pagados",    icon: <CheckCircle2 className="w-5 h-5 text-green-500" />, color: "text-green-600", badgeColor: "bg-green-50 text-green-700" },
  PENDIENTE: { label: "Pendientes", icon: <Clock className="w-5 h-5 text-yellow-500" />,       color: "text-yellow-600", badgeColor: "bg-yellow-50 text-yellow-700" },
  ATRASADO:  { label: "Atrasados",  icon: <AlertCircle className="w-5 h-5 text-red-500" />,    color: "text-red-600",    badgeColor: "bg-red-50 text-red-700" },
};

export default function GastosPorEstadoPage({ searchParams }: { searchParams: Promise<{ estado?: string; mes?: string }> }) {
  const params = use(searchParams);
  const estado = params.estado?.toUpperCase() ?? "PENDIENTE";
  const mes    = params.mes ?? "";

  const [gastos, setGastos]   = useState<GastoDetalle[]>([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    setCargando(true);
    fetch(`/api/gastos/por-estado?estado=${estado}&mes=${mes}`)
      .then((r) => r.json())
      .then((data) => { setGastos(data.gastos ?? []); setCargando(false); });
  }, [estado, mes]);

  const cfg = CONFIG[estado] ?? CONFIG.PENDIENTE;

  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div>
        <Link href="/gastos" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Volver a gastos
        </Link>
        <div className="mt-3 flex items-center gap-3">
          {cfg.icon}
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              Departamentos {cfg.label}
            </h1>
            <p className="text-sm text-gray-500 mt-0.5">
              {mes ? formatMes(mes) : ""} · {cargando ? "..." : `${gastos.length} departamento${gastos.length !== 1 ? "s" : ""}`}
            </p>
          </div>
        </div>
      </div>

      {/* Tabla */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {!cargando && gastos.length === 0 ? (
          <div className="px-6 py-16 text-center text-sm text-gray-400">
            No hay departamentos con estado "{cfg.label.toLowerCase()}" este mes.
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Departamento</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Torre</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Dueño legal</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Contacto</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Monto</th>
                  {estado === "PAGADO" ? (
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Fecha pago</th>
                  ) : (
                    <th className="text-left px-6 py-3 font-medium text-gray-500">Meses sin pagar</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {gastos.map((g, i) => (
                  <tr key={g.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="px-6 py-4">
                      <Link href={`/departamentos/${g.departamento.id}`}
                        className="font-medium text-blue-600 hover:text-blue-800 transition-colors">
                        {g.departamento.numero || "Sin número"}
                      </Link>
                    </td>
                    <td className="px-6 py-4 text-gray-500">{g.departamento.torre.nombre}</td>
                    <td className="px-6 py-4 text-gray-700">{g.departamento.dueno?.nombre ?? "—"}</td>
                    <td className="px-6 py-4 text-gray-500">{g.departamento.dueno?.telefono ?? "—"}</td>
                    <td className="px-6 py-4 font-medium text-gray-900">${g.monto.toLocaleString("es-CL")}</td>
                    {estado === "PAGADO" ? (
                      <td className="px-6 py-4 text-gray-500">
                        {g.fechaPago ? new Date(g.fechaPago).toLocaleDateString("es-CL") : "—"}
                      </td>
                    ) : (
                      <td className="px-6 py-4">
                        <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${g.mesesAtrasados > 1 ? "bg-red-50 text-red-700" : "bg-yellow-50 text-yellow-700"}`}>
                          {g.mesesAtrasados} mes{g.mesesAtrasados !== 1 ? "es" : ""}
                        </span>
                      </td>
                    )}
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