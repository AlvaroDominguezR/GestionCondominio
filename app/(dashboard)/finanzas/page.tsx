"use client";

import { useState, useEffect, useCallback } from "react";
import { TrendingUp, TrendingDown, Trash2, Plus, FileDown } from "lucide-react";

type Movimiento = {
  id: number;
  descripcion: string;
  monto: number;
  fecha: string;
};

type GastoPagado = {
  id: number;
  monto: number;
  fechaPago: string;
  departamento: { numero: string; torre: { nombre: string } };
};

type Totales = {
  totalIngresos: number;
  totalEgresos: number;
  totalGastosPagados: number;
  balance: number;
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

// ─── Modal Ingreso/Egreso ───────────────────────────────────
function ModalMovimiento({ tipo, onClose, onGuardado }: { tipo: "ingreso" | "egreso"; onClose: () => void; onGuardado: () => void }) {
  const [descripcion, setDescripcion] = useState("");
  const [monto, setMonto]             = useState("");
  const [fecha, setFecha]             = useState(new Date().toISOString().split("T")[0]);
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!descripcion || !monto) { setError("Completa todos los campos."); return; }
    setGuardando(true);
    const res = await fetch(`/api/${tipo === "ingreso" ? "ingresos" : "egresos"}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ descripcion, monto: parseFloat(monto), fecha }),
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
  const [pestana, setPestana]       = useState<"ingresos" | "egresos" | "gastos">("ingresos");
  const [ingresos, setIngresos]     = useState<Movimiento[]>([]);
  const [egresos, setEgresos]       = useState<Movimiento[]>([]);
  const [gastos, setGastos]         = useState<GastoPagado[]>([]);
  const [totales, setTotales]       = useState<Totales>({ totalIngresos: 0, totalEgresos: 0, totalGastosPagados: 0, balance: 0 });
  const [cargando, setCargando]     = useState(true);
  const [modalTipo, setModalTipo]   = useState<"ingreso" | "egreso" | null>(null);
  const [refresh, setRefresh]       = useState(0);

  const cargar = useCallback(async () => {
    setCargando(true);
    const res  = await fetch(`/api/finanzas?mes=${mes}`);
    const data = await res.json();
    setIngresos(data.ingresos ?? []);
    setEgresos(data.egresos ?? []);
    setGastos(data.gastosPagados ?? []);
    setTotales(data.totales ?? { totalIngresos: 0, totalEgresos: 0, totalGastosPagados: 0, balance: 0 });
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
            <FileDown className="w-4 h-4" />PDF
          </button>
        </div>
      </div>

      {/* Selector mes */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Período:</label>
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
        <span className="text-sm text-gray-500">{formatMes(mes)}</span>
      </div>

      {/* Tarjetas resumen */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400">Gastos comunes cobrados</p>
          <p className="text-xl font-bold text-green-600 mt-1">${totales.totalGastosPagados.toLocaleString("es-CL")}</p>
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
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400">Balance neto</p>
          <p className={`text-xl font-bold mt-1 ${totales.balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
            ${totales.balance.toLocaleString("es-CL")}
          </p>
        </div>
      </div>

      {/* Pestañas */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="flex border-b border-gray-100">
          {[
            { key: "ingresos", label: `Otros ingresos (${ingresos.length})` },
            { key: "egresos",  label: `Egresos (${egresos.length})` },
            { key: "gastos",   label: `Gastos comunes cobrados (${gastos.length})` },
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
        {pestana === "ingresos" && (
          ingresos.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">No hay ingresos registrados este mes.</div>
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
                {ingresos.map((i, idx) => (
                  <tr key={i.id} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="px-6 py-4 text-gray-900">{i.descripcion}</td>
                    <td className="px-6 py-4 text-gray-500">{formatFecha(i.fecha)}</td>
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
          )
        )}

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

        {/* Gastos comunes pagados */}
        {pestana === "gastos" && (
          gastos.length === 0 ? (
            <div className="px-6 py-16 text-center text-sm text-gray-400">No hay gastos comunes cobrados este mes.</div>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-gray-100 bg-gray-50">
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Departamento</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Torre</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Fecha pago</th>
                  <th className="text-left px-6 py-3 font-medium text-gray-500">Monto</th>
                </tr>
              </thead>
              <tbody>
                {gastos.map((g, idx) => (
                  <tr key={g.id} className={`border-b border-gray-100 last:border-0 ${idx % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                    <td className="px-6 py-4 font-medium text-gray-900">{g.departamento.numero || "Sin número"}</td>
                    <td className="px-6 py-4 text-gray-500">{g.departamento.torre.nombre}</td>
                    <td className="px-6 py-4 text-gray-500">{g.fechaPago ? formatFecha(g.fechaPago) : "—"}</td>
                    <td className="px-6 py-4 font-semibold text-green-600">${g.monto.toLocaleString("es-CL")}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )
        )}
      </div>

      {modalTipo && (
        <ModalMovimiento tipo={modalTipo} onClose={() => setModalTipo(null)} onGuardado={() => setRefresh((n) => n + 1)} />
      )}

    </div>
  );
}