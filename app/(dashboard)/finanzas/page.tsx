"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Trash2, Plus, FileDown } from "lucide-react";

type Movimiento = {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string;
  metodoPago: string;
};

type GastoPagado = {
  deptoId: number;
  numero: string;
  torre: string;
  mesesLabel: string;
  totalMonto: number;
  fechaPago: string | null;
  metodoPago: string | null;
};

type PagoHistorico = {
  deptoId: number;
  numero: string;
  torre: string;
  mesesLabel: string;
  totalMonto: number;
  fechaPago: string;
  metodoPago: string | null;
};

type Totales = {
  totalIngresos: number;
  totalEgresos: number;
  totalGastosPagados: number;
  totalPagosHistoricos: number;
  balance: number;
  saldoInicial: number;
  saldoFinal: number;
};

function getMesActual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMes(mes: string) {
  const [year, month] = mes.split("-");
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${meses[parseInt(month) - 1]} ${year}`;
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CL");
}

function BadgeMetodo({ metodo }: { metodo: string | null }) {
  if (!metodo) return null;
  const isTransferencia = metodo === "TRANSFERENCIA";
  return (
    <span className={`inline-block text-xs font-medium px-2 py-0.5 rounded-full
      ${isTransferencia ? "bg-green-50 text-green-700" : "bg-gray-100 text-gray-600"}`}>
      {isTransferencia ? "Transferencia" : "Efectivo"}
    </span>
  );
}

// ─── Modal Ingreso/Egreso ───────────────────────────────────
function ModalMovimiento({ tipo, onClose, onGuardado }: { tipo: "ingreso" | "egreso"; onClose: () => void; onGuardado: () => void }) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto]             = useState("");
  const [fecha, setFecha]             = useState(new Date().toISOString().split("T")[0]);
  const [metodoPago, setMetodoPago]   = useState<"TRANSFERENCIA" | "EFECTIVO">("TRANSFERENCIA");
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion || !monto) { setError("Completa todos los campos."); return; }
    setGuardando(true);
    const res = await fetch(`/api/${tipo === "ingreso" ? "ingresos" : "egresos"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descripcion, monto: parseFloat(monto), fecha, metodoPago }),
    });
    const data = await res.json();
    if (data.error) { setError(data.error); setGuardando(false); return; }
    onGuardado();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Registrar {tipo === "ingreso" ? "ingreso" : "egreso"}
          </h2>
          <p className="text-sm text-gray-500 mt-1">
            {tipo === "ingreso" ? "Entrada de dinero al condominio" : "Gasto operacional del condominio"}
          </p>
        </div>
        {error && <p className="text-sm text-red-500">{error}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Descripción</label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)} required
              placeholder={tipo === "ingreso" ? "Ej: Aporte municipalidad" : "Ej: Pago sueldo jardinero"}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Monto (CLP)</label>
            <input type="number" value={monto} onChange={(e) => setMonto(e.target.value)} required
              placeholder="Ej: 300000"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {tipo === "ingreso" && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Método de pago</label>
              <div className="grid grid-cols-2 gap-2">
                {(["TRANSFERENCIA", "EFECTIVO"] as const).map((m) => (
                  <label key={m} className={`flex items-center justify-center border rounded-lg px-3 py-2.5 cursor-pointer transition-colors
                    ${metodoPago === m ? (m === "TRANSFERENCIA" ? "border-green-500 bg-green-50" : "border-gray-400 bg-gray-100") : "border-gray-200 hover:border-gray-300"}`}>
                    <input type="radio" className="sr-only" checked={metodoPago === m} onChange={() => setMetodoPago(m)} />
                    <span className="text-sm font-medium text-gray-700">{m === "TRANSFERENCIA" ? "Transferencia" : "Efectivo"}</span>
                  </label>
                ))}
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={guardando}
              className={`flex-1 text-white text-sm font-medium py-3 rounded-lg disabled:opacity-50 transition-colors
                ${tipo === "ingreso" ? "bg-green-600 hover:bg-green-700" : "bg-red-500 hover:bg-red-600"}`}>
              {guardando ? "Guardando..." : "Guardar"}
            </button>
            <button type="button" onClick={onClose}
              className="flex-1 border border-gray-200 text-sm text-gray-500 py-3 rounded-lg hover:bg-gray-50">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────
export default function FinanzasPage() {
  const [mes, setMes]               = useState(getMesActual());
  const [pestana, setPestana]         = useState<"ingresos" | "egresos" | "gastos" | "historicos">("ingresos");
  const [ingresos, setIngresos]       = useState<Movimiento[]>([]);
  const [egresos, setEgresos]         = useState<Movimiento[]>([]);
  const [gastos, setGastos]           = useState<GastoPagado[]>([]);
  const [historicos, setHistoricos]   = useState<PagoHistorico[]>([]);
  const [totales, setTotales]         = useState<Totales>({ totalIngresos: 0, totalEgresos: 0, totalGastosPagados: 0, totalPagosHistoricos: 0, balance: 0, saldoInicial: 0, saldoFinal: 0 });
  const [cargando, setCargando]       = useState(true);
  const [modalTipo, setModalTipo]     = useState<"ingreso" | "egreso" | null>(null);
  const [refresh, setRefresh]         = useState(0);
  const [modalAnual, setModalAnual]   = useState(false);
  const [mesInicio, setMesInicio]     = useState("");
  const [mesFin, setMesFin]           = useState("");
  const [filtroMetodo, setFiltroMetodo] = useState<"TODOS" | "TRANSFERENCIA" | "EFECTIVO">("TODOS");

  const cargar = useCallback(async () => {
    setCargando(true);
    const res  = await fetch(`/api/finanzas?mes=${mes}`);
    const data = await res.json();
    setIngresos(data.ingresos ?? []);
    setEgresos(data.egresos ?? []);
    setGastos(data.gastosPagados ?? []);
    setHistoricos(data.pagosHistoricos ?? []);
    setTotales(data.totales ?? { totalIngresos: 0, totalEgresos: 0, totalGastosPagados: 0, totalPagosHistoricos: 0, balance: 0, saldoInicial: 0, saldoFinal: 0 });
    setCargando(false);
  }, [mes, refresh]);

  useEffect(() => { cargar(); }, [cargar]);

  async function eliminar(id: number, tipo: "ingreso" | "egreso") {
    await fetch("/api/finanzas", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, tipo }),
    });
    setRefresh((n) => n + 1);
  }

  async function handleDescargarPDF() {
  window.open(`/api/reportes/finanzas?mes=${mes}`, "_blank");
  }

  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Finanzas</h1>
          <p className="text-sm text-gray-500 mt-1">Historial de ingresos y egresos</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalTipo("ingreso")}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 border border-green-200 transition-colors">
            <Plus className="w-4 h-4" />Ingreso
          </button>
          <button onClick={() => setModalTipo("egreso")}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 border border-red-200 transition-colors">
            <Plus className="w-4 h-4" />Egreso
          </button>
          <button onClick={handleDescargarPDF}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-colors">
            <FileDown className="w-4 h-4" />Reporte Mensual
          </button>
          <button onClick={() => setModalAnual(true)}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-colors">
            <FileDown className="w-4 h-4" />Balance Financiero
          </button>
        </div>
      </div>

      {/* Selector mes */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Período:</label>
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400">Saldo apertura</p>
          <p className="text-xl font-bold text-gray-900 mt-1">${totales.saldoInicial.toLocaleString("es-CL")}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400">Gastos comunes cobrados</p>
          <p className="text-xl font-bold text-green-600 mt-1">${totales.totalGastosPagados.toLocaleString("es-CL")}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400">Pago deudas históricas</p>
          <p className="text-xl font-bold text-green-600 mt-1">${totales.totalPagosHistoricos.toLocaleString("es-CL")}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingUp className="w-3.5 h-3.5 text-green-500" />
            <p className="text-xs text-gray-400">Otros ingresos</p>
          </div>
          <p className="text-xl font-bold text-green-600">${totales.totalIngresos.toLocaleString("es-CL")}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center gap-1.5 mb-1">
            <TrendingDown className="w-3.5 h-3.5 text-red-500" />
            <p className="text-xs text-gray-400">Egresos</p>
          </div>
          <p className="text-xl font-bold text-red-500">${totales.totalEgresos.toLocaleString("es-CL")}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5 col-span-2 sm:col-span-5">
          <p className="text-xs text-gray-400">Balance neto</p>
          <p className={`text-xl font-bold mt-1 ${totales.balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
            ${totales.balance.toLocaleString("es-CL")}
          </p>
          <p className="text-sm text-gray-500 mt-2">Saldo cierre: ${totales.saldoFinal.toLocaleString("es-CL")}</p>
        </div>
      </div>

      {/* Filtro método de pago */}
      <div className="flex items-center gap-2">
        <span className="text-sm text-gray-500">Filtrar por método:</span>
        {(["TODOS", "TRANSFERENCIA", "EFECTIVO"] as const).map((m) => (
          <button key={m} onClick={() => setFiltroMetodo(m)}
            className={`text-xs font-medium px-3 py-1.5 rounded-full border transition-colors
              ${filtroMetodo === m
                ? m === "TRANSFERENCIA" ? "bg-green-50 border-green-400 text-green-700"
                  : m === "EFECTIVO" ? "bg-gray-200 border-gray-400 text-gray-700"
                  : "bg-gray-900 border-gray-900 text-white"
                : "border-gray-200 text-gray-500 hover:border-gray-300"}`}>
            {m === "TODOS" ? "Todos" : m === "TRANSFERENCIA" ? "Transferencia" : "Efectivo"}
          </button>
        ))}
      </div>

      {/* Pestañas */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { key: "ingresos",   label: `Otros ingresos (${ingresos.length})` },
            { key: "egresos",    label: `Egresos (${egresos.length})` },
            { key: "gastos",     label: `Gastos comunes cobrados (${gastos.length})` },
            { key: "historicos", label: `Pago deudas históricas (${historicos.length})` },
          ].map((p) => (
            <button key={p.key} onClick={() => setPestana(p.key as typeof pestana)}
              className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px
                ${pestana === p.key
                  ? "border-gray-900 text-gray-900"
                  : "border-transparent text-gray-400 hover:text-gray-700"}`}>
              {p.label}
            </button>
          ))}
        </div>

        {/* Ingresos */}
        {pestana === "ingresos" && (() => {
          const filtrados = filtroMetodo === "TODOS" ? ingresos : ingresos.filter((i) => i.metodoPago === filtroMetodo);
          return filtrados.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">No hay ingresos{filtroMetodo !== "TODOS" ? ` por ${filtroMetodo === "TRANSFERENCIA" ? "transferencia" : "efectivo"}` : ""} registrados este mes.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Descripción</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Método</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Monto</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {filtrados.map((i, idx) => (
                  <tr key={i.id} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="px-6 py-4 text-gray-900">{i.descripcion}</td>
                    <td className="px-6 py-4 text-gray-500">{formatFecha(i.fecha)}</td>
                    <td className="px-6 py-4"><BadgeMetodo metodo={i.metodoPago} /></td>
                    <td className="px-6 py-4 font-semibold text-green-600">${i.monto.toLocaleString("es-CL")}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => eliminar(i.id, "ingreso")} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}

        {/* Egresos */}
        {pestana === "egresos" && (
          egresos.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">No hay egresos registrados este mes.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Descripción</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Fecha</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Monto</th>
                  <th className="px-6 py-3" />
                </tr>
              </thead>
              <tbody>
                {egresos.map((e, idx) => (
                  <tr key={e.id} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="px-6 py-4 text-gray-900">{e.descripcion}</td>
                    <td className="px-6 py-4 text-gray-500">{formatFecha(e.fecha)}</td>
                    <td className="px-6 py-4 font-semibold text-red-500">${e.monto.toLocaleString("es-CL")}</td>
                    <td className="px-6 py-4 text-right">
                      <button onClick={() => eliminar(e.id, "egreso")} className="text-gray-300 hover:text-red-500 transition-colors">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}

        {/* Pago deudas históricas */}
        {pestana === "historicos" && (() => {
          const filtrados = filtroMetodo === "TODOS" ? historicos : historicos.filter((h) => h.metodoPago === filtroMetodo);
          return filtrados.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">No hay pagos de deuda histórica{filtroMetodo !== "TODOS" ? ` por ${filtroMetodo === "TRANSFERENCIA" ? "transferencia" : "efectivo"}` : ""} este mes.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Departamento</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Torre</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Meses pagados</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Método</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Fecha pago</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((h, idx) => (
                  <tr key={`${h.deptoId}-${h.metodoPago}`} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="px-6 py-4 font-medium text-gray-900">{h.numero}</td>
                    <td className="px-6 py-4 text-gray-500">{h.torre}</td>
                    <td className="px-6 py-4 text-gray-500 capitalize">{h.mesesLabel}</td>
                    <td className="px-6 py-4"><BadgeMetodo metodo={h.metodoPago} /></td>
                    <td className="px-6 py-4 font-semibold text-green-600">${h.totalMonto.toLocaleString("es-CL")}</td>
                    <td className="px-6 py-4 text-gray-500">{formatFecha(h.fechaPago)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}

        {/* Gastos comunes pagados */}
        {pestana === "gastos" && (() => {
          const filtrados = filtroMetodo === "TODOS" ? gastos : gastos.filter((g) => g.metodoPago === filtroMetodo);
          return filtrados.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">No hay gastos comunes{filtroMetodo !== "TODOS" ? ` por ${filtroMetodo === "TRANSFERENCIA" ? "transferencia" : "efectivo"}` : ""} cobrados este mes.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Departamento</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Torre</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Meses pagados</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Método</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Total</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Fecha pago</th>
                </tr>
              </thead>
              <tbody>
                {filtrados.map((g, idx) => (
                  <tr key={`${g.deptoId}-${g.metodoPago}`} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="px-6 py-4 font-medium text-gray-900">{g.numero}</td>
                    <td className="px-6 py-4 text-gray-500">{g.torre}</td>
                    <td className="px-6 py-4 text-gray-500 capitalize">
                      {g.mesesLabel.includes(",") || g.mesesLabel.includes("/")
                        ? g.mesesLabel
                        : new Date(g.fechaPago ?? "").toLocaleDateString("es-CL", { month: "long", year: "numeric" })}
                    </td>
                    <td className="px-6 py-4"><BadgeMetodo metodo={g.metodoPago} /></td>
                    <td className="px-6 py-4 font-semibold text-green-600">${g.totalMonto.toLocaleString("es-CL")}</td>
                    <td className="px-6 py-4 text-gray-500">{g.fechaPago ? new Date(g.fechaPago).toLocaleDateString("es-CL") : "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          );
        })()}
      </div>

      {modalTipo && (
        <ModalMovimiento tipo={modalTipo} onClose={() => setModalTipo(null)} onGuardado={() => setRefresh((n) => n + 1)} />
      )}

      {modalAnual && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Reporte por período</h2>
              <p className="text-sm text-gray-500 mt-1">Selecciona el rango de meses (mínimo 6)</p>
            </div>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Mes inicio</label>
                <input type="month" value={mesInicio} onChange={(e) => setMesInicio(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Mes fin</label>
                <input type="month" value={mesFin} onChange={(e) => setMesFin(e.target.value)}
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
            <div className="flex gap-3">
              <button
                onClick={() => {
                  if (!mesInicio || !mesFin) return;
                  window.open(`/api/reportes/finanzas-anual?mesInicio=${mesInicio}&mesFin=${mesFin}`, "_blank");
                  setModalAnual(false);
                }}
                className="flex-1 bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-700">
                Generar PDF
              </button>
              <button onClick={() => setModalAnual(false)}
                className="flex-1 border border-gray-200 text-sm text-gray-500 py-3 rounded-lg hover:bg-gray-50">
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}