"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { FileDown, Trash2, Plus, RotateCcw, CreditCard } from "lucide-react";
import { ModalCodigoTransaccion } from "@/components/ModalCodigoTransaccion";


type Gasto = {
  id: number;
  monto: number;
  periodo: string;
  estadoPago: string;
  fechaPago: string | null;
};

type Config = {
  montoHistoricoAntes: number;
  montoHistoricoDesde: number;
};

const MESES = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];

function formatPeriodo(periodo: string) {
  const d = new Date(periodo);
  return `${MESES[d.getUTCMonth()]} ${d.getUTCFullYear()}`;
}

function getAnio(periodo: string): number {
  return new Date(periodo).getUTCFullYear();
}

export default function DeudaHistoricaPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [gastos, setGastos]         = useState<Gasto[]>([]);
  const [config, setConfig]         = useState<Config | null>(null);
  const [mesInicio, setMesInicio]   = useState("2016-01");
  const [mesFin, setMesFin]         = useState("2024-12");
  const [generando, setGenerando]   = useState(false);
  const [pagando, setPagando]       = useState(false);
  const [seleccionados, setSeleccionados] = useState<Set<number>>(new Set());
  const [metodoPago, setMetodoPago]     = useState<"TRANSFERENCIA" | "EFECTIVO">("TRANSFERENCIA");
  const [anioFiltro, setAnioFiltro]     = useState<number | null>(null);
  const [refresh, setRefresh]           = useState(0);
  const [modalCodigo, setModalCodigo]   = useState(false);

  useEffect(() => {
    fetch(`/api/deuda-historica?departamentoId=${id}`)
      .then((r) => r.json())
      .then((data) => {
        setGastos(data.gastos ?? []);
        setConfig(data.config);
      });
  }, [id, refresh]);

  async function handleGenerar() {
    setGenerando(true);
    await fetch("/api/deuda-historica", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departamentoId: Number(id), mesInicio, mesFin }),
    });
    setGenerando(false);
    setRefresh((n) => n + 1);
  }

  const aniosDisponibles   = [...new Set(gastos.map((g) => getAnio(g.periodo)))].sort((a, b) => b - a);
  const gastosFiltrados    = anioFiltro ? gastos.filter((g) => getAnio(g.periodo) === anioFiltro) : gastos;
  const pendientes         = gastosFiltrados.filter((g) => g.estadoPago === "HISTORICO");
  const todosSeleccionados = pendientes.length > 0 && pendientes.every((g) => seleccionados.has(g.id));
  const totalSeleccionado  = gastos.filter((g) => seleccionados.has(g.id)).reduce((acc, g) => acc + g.monto, 0);

  function toggleSeleccion(id: number) {
    setSeleccionados((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  function toggleTodos() {
    if (todosSeleccionados) {
      setSeleccionados(new Set());
    } else {
      setSeleccionados(new Set(pendientes.map((g) => g.id)));
    }
  }

  async function handlePagarSeleccionados() {
    if (seleccionados.size === 0) return;
    if (metodoPago === "TRANSFERENCIA") {
      setModalCodigo(true);
      return;
    }
    if (!confirm(
      `¿Registrar pago de ${seleccionados.size} mes${seleccionados.size > 1 ? "es" : ""} por $${totalSeleccionado.toLocaleString("es-CL")} en total?\n\nEsto sumará al balance de finanzas del mes actual.`
    )) return;
    await ejecutarPago(null);
  }

  async function ejecutarPago(codigoTransaccion: string | null) {
    setPagando(true);
    await fetch("/api/deuda-historica", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ gastoIds: Array.from(seleccionados), metodoPago, codigoTransaccion }),
    });
    setSeleccionados(new Set());
    setPagando(false);
    setRefresh((n) => n + 1);
  }

  async function handleRevertir(gastoId: number) {
    if (!confirm("¿Revertir este pago? Se eliminará el ingreso del balance de finanzas.")) return;
    await fetch("/api/deuda-historica", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ revertirId: gastoId }),
    });
    setRefresh((n) => n + 1);
  }

  async function handleEliminarTodo() {
    if (!confirm("¿Estás seguro de eliminar todos los registros históricos?")) return;
    await fetch("/api/deuda-historica", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departamentoId: Number(id) }),
    });
    setRefresh((n) => n + 1);
  }

  const totalDeuda  = gastos.filter((g) => g.estadoPago === "HISTORICO").reduce((acc, g) => acc + g.monto, 0);
  const totalPagado = gastos.filter((g) => g.estadoPago === "HISTORICO_PAGADO").reduce((acc, g) => acc + g.monto, 0);

  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div>
        <Link href={`/departamentos/${id}`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Volver al departamento
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Deuda Histórica</h1>
            <p className="text-sm text-gray-500 mt-1">Registro de gastos comunes anteriores al sistema</p>
          </div>
          <div className="flex items-center gap-2">
            {gastos.length > 0 && (
              <>
                <button
                  onClick={() => window.open(`/api/reportes/deuda-historica?id=${id}`, "_blank")}
                  className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
                  <FileDown className="w-4 h-4" />PDF
                </button>
                <button
                  onClick={handleEliminarTodo}
                  className="flex items-center gap-2 border border-red-200 text-red-600 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-red-50 transition-colors">
                  <Trash2 className="w-4 h-4" />Limpiar registros
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Montos configurados */}
      {config && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">Monto hasta 2024</p>
            <p className="text-xl font-bold text-gray-900">${config.montoHistoricoAntes.toLocaleString("es-CL")}/mes</p>
          </div>
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">Monto desde 2025</p>
            <p className="text-xl font-bold text-gray-900">${config.montoHistoricoDesde.toLocaleString("es-CL")}/mes</p>
          </div>
        </div>
      )}

      {/* Generar rango */}
      <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-4">
        <h2 className="font-semibold text-gray-900">Registrar período de deuda</h2>
        <div className="flex items-center gap-4">
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-medium text-gray-700">Desde</label>
            <input type="month" value={mesInicio} onChange={(e) => setMesInicio(e.target.value)}
              min="2016-01" max="2025-12"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="space-y-1.5 flex-1">
            <label className="text-xs font-medium text-gray-700">Hasta</label>
            <input type="month" value={mesFin} onChange={(e) => setMesFin(e.target.value)}
              min="2016-01" max="2025-12"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="pt-5">
            <button onClick={handleGenerar} disabled={generando}
              className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-6 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
              <Plus className="w-4 h-4" />
              {generando ? "Generando..." : "Registrar meses"}
            </button>
          </div>
        </div>
      </div>

      {/* Resumen */}
      {gastos.length > 0 && (
        <div className="grid grid-cols-3 gap-4">
          <div className="bg-white border border-gray-200 rounded-xl p-5">
            <p className="text-xs text-gray-400 mb-1">Total meses registrados</p>
            <p className="text-2xl font-bold text-gray-900">{gastos.length}</p>
          </div>
          <div className="bg-red-50 border border-red-200 rounded-xl p-5">
            <p className="text-xs text-red-400 mb-1">Deuda pendiente</p>
            <p className="text-2xl font-bold text-red-600">${totalDeuda.toLocaleString("es-CL")}</p>
          </div>
          <div className="bg-green-50 border border-green-200 rounded-xl p-5">
            <p className="text-xs text-green-500 mb-1">Total pagado históricamente</p>
            <p className="text-2xl font-bold text-green-600">${totalPagado.toLocaleString("es-CL")}</p>
          </div>
        </div>
      )}

      {/* Tabla */}
      {gastos.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          {/* Cabecera con barra de acción */}
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between gap-4">
            <div>
              <h2 className="font-semibold text-gray-900">Detalle por mes</h2>
              <p className="text-xs text-gray-400 mt-0.5">
                {seleccionados.size > 0
                  ? `${seleccionados.size} mes${seleccionados.size > 1 ? "es" : ""} seleccionado${seleccionados.size > 1 ? "s" : ""} · $${totalSeleccionado.toLocaleString("es-CL")} total`
                  : "Selecciona los meses con deuda para registrar el pago"}
              </p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              {/* Filtros de año */}
              {aniosDisponibles.length > 1 && (
                <div className="flex items-center gap-1.5">
                  {aniosDisponibles.map((anio) => (
                    <button key={anio}
                      onClick={() => {
                        setAnioFiltro(anioFiltro === anio ? null : anio);
                        setSeleccionados(new Set());
                      }}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                        ${anioFiltro === anio
                          ? "bg-gray-900 border-gray-900 text-white"
                          : "border-gray-200 text-gray-500 hover:border-gray-400 hover:text-gray-700"}`}>
                      {anio}
                    </button>
                  ))}
                </div>
              )}
            </div>
            {seleccionados.size > 0 && (
              <div className="flex items-center gap-3 shrink-0">
                <div className="flex gap-1.5">
                  {(["TRANSFERENCIA", "EFECTIVO"] as const).map((m) => (
                    <button key={m} type="button" onClick={() => setMetodoPago(m)}
                      className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
                        ${metodoPago === m
                          ? m === "TRANSFERENCIA" ? "bg-green-50 border-green-400 text-green-700" : "bg-gray-200 border-gray-400 text-gray-700"
                          : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
                      {m === "TRANSFERENCIA" ? "Transferencia" : "Efectivo"}
                    </button>
                  ))}
                </div>
                <button
                  onClick={handlePagarSeleccionados}
                  disabled={pagando}
                  className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
                  <CreditCard className="w-4 h-4" />
                  {pagando ? "Registrando..." : `Registrar pago`}
                </button>
              </div>
            )}
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="px-6 py-3 w-10">
                    {pendientes.length > 0 && (
                      <input
                        type="checkbox"
                        checked={todosSeleccionados}
                        onChange={toggleTodos}
                        className="w-4 h-4 accent-gray-900 cursor-pointer"
                        title="Seleccionar todos los pendientes"
                      />
                    )}
                  </th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Período</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Monto</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Estado</th>
                  <th className="text-left px-4 py-3 font-medium text-gray-500">Fecha pago</th>
                </tr>
              </thead>
              <tbody>
                {gastosFiltrados.map((g, i) => {
                  const isPendiente = g.estadoPago === "HISTORICO";
                  const isSeleccionado = seleccionados.has(g.id);
                  return (
                    <tr
                      key={g.id}
                      onClick={() => isPendiente && toggleSeleccion(g.id)}
                      className={`border-b border-gray-100 last:border-0 transition-colors
                        ${isPendiente ? "cursor-pointer" : ""}
                        ${isSeleccionado ? "bg-blue-50/60" : i % 2 === 0 ? "" : "bg-gray-50/50"}
                        ${isPendiente ? "hover:bg-blue-50/40" : ""}
                      `}>
                      <td className="px-6 py-4">
                        {isPendiente && (
                          <input
                            type="checkbox"
                            checked={isSeleccionado}
                            onChange={() => toggleSeleccion(g.id)}
                            onClick={(e) => e.stopPropagation()}
                            className="w-4 h-4 accent-gray-900 cursor-pointer"
                          />
                        )}
                      </td>
                      <td className="px-4 py-4 font-medium text-gray-900 capitalize">{formatPeriodo(g.periodo)}</td>
                      <td className="px-4 py-4 text-gray-900">${g.monto.toLocaleString("es-CL")}</td>
                      <td className="px-4 py-4">
                        {isPendiente ? (
                          <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-red-50 text-red-700">
                            Pendiente
                          </span>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-xs font-medium px-3 py-1.5 rounded-full bg-green-50 text-green-700">
                              Pagado
                            </span>
                            <button
                              onClick={(e) => { e.stopPropagation(); handleRevertir(g.id); }}
                              title="Revertir pago"
                              className="text-gray-300 hover:text-red-500 transition-colors">
                              <RotateCcw className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-4 py-4 text-gray-500">
                        {g.fechaPago ? new Date(g.fechaPago).toLocaleDateString("es-CL") : "—"}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {gastos.length === 0 && (
        <div className="bg-white border border-dashed border-gray-300 rounded-xl px-6 py-16 text-center">
          <p className="text-sm text-gray-400">No hay registros históricos para este departamento.</p>
          <p className="text-xs text-gray-400 mt-1">Selecciona un rango de fechas y presiona "Registrar meses".</p>
        </div>
      )}

      {modalCodigo && (
        <ModalCodigoTransaccion
          loading={pagando}
          onConfirm={(codigo) => { setModalCodigo(false); ejecutarPago(codigo); }}
          onCancel={() => setModalCodigo(false)}
        />
      )}

    </div>
  );
}