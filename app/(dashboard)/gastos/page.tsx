"use client";

import { useState, useEffect, useCallback } from "react";
import { Receipt, CheckCircle2, Clock, AlertCircle, Settings, CreditCard, FileDown, Search } from "lucide-react";
import Link from "next/link";

type GastoDepto = {
  id: number;
  monto: number;
  periodo: string;
  estadoPago: string;
  fechaPago: string | null;
  departamento: {
    id: number;
    numero: string;
    torre: { nombre: string; sector: string };
  };
};

type UltimoPago = {
  id: number;
  monto: number;
  periodo: string;
  fechaPago: string | null;
  departamento: {
    numero: string;
    torre: { nombre: string };
  };
};

type Stats = {
  totalDeptos: number;
  pagados: number;
  pendientes: number;
  atrasados: number;
  montoTotal: number;
  montoPagado: number;
};

type Torre = {
  id: number;
  nombre: string;
  departamentos: { id: number; numero: string }[];
};

type MesPago = {
  key: string;
  label: string;
  gastoId: number | null;
  estadoPago: string | null;
  monto: number;
};

function getMesActual() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

function formatMes(periodo: string) {
  const [year, month] = periodo.split("-");
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${meses[parseInt(month) - 1]} ${year}`;
}

// ─── Modal Registrar Pago ───────────────────────────────────
function ModalRegistrarPago({ onClose, onPagado }: { onClose: () => void; onPagado: () => Promise<void> }) {
  const [paso, setPaso]                   = useState<"torre" | "depto" | "meses">("torre");
  const [torres, setTorres]               = useState<Torre[]>([]);
  const [torreSeleccionada, setTorre]     = useState<Torre | null>(null);
  const [deptoSeleccionado, setDepto]     = useState<{ id: number; numero: string } | null>(null);
  const [meses, setMeses]                 = useState<MesPago[]>([]);
  const [mesesSeleccionados, setMesesSel] = useState<string[]>([]);
  const [guardando, setGuardando]         = useState(false);
  const [error, setError]                 = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/torres-con-deptos")
      .then((r) => r.json())
      .then((data) => setTorres(data.torres));
  }, []);

  async function handleSeleccionarDepto(depto: { id: number; numero: string }) {
    setDepto(depto);
    const res  = await fetch(`/api/gastos/registrar-pago?departamentoId=${depto.id}`);
    const data = await res.json();
    if (data.error) { setError(data.error); return; }
    setMeses(data.meses);
    setPaso("meses");
  }

  function toggleMes(key: string) {
    setMesesSel((prev) =>
      prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]
    );
  }

  async function handleConfirmar() {
    if (mesesSeleccionados.length === 0) return;
    setGuardando(true);
    const seleccionados = meses
      .filter((m) => mesesSeleccionados.includes(m.key))
      .map((m) => ({ key: m.key, gastoId: m.gastoId }));

    const res = await fetch("/api/gastos/registrar-pago", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ departamentoId: deptoSeleccionado?.id, mesesSeleccionados: seleccionados }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "No se pudo registrar el pago.");
      setGuardando(false);
      return;
    }

    await onPagado();
    setGuardando(false);
    onClose();
  }

  const totalSeleccionado = meses
    .filter((m) => mesesSeleccionados.includes(m.key))
    .reduce((acc, m) => acc + m.monto, 0);

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        {paso === "torre" && (
          <>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Registrar pago</h2>
              <p className="text-sm text-gray-500 mt-1">Selecciona la torre del departamento</p>
            </div>
            <div className="space-y-2 max-h-72 overflow-y-auto">
              {torres.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No hay torres con departamentos ocupados.</p>
              ) : torres.map((t) => (
                <button key={t.id} onClick={() => { setTorre(t); setPaso("depto"); }}
                  className="w-full flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left">
                  <div className={`w-8 h-8 rounded-lg flex items-center justify-center text-white text-xs font-bold ${t.nombre.endsWith("A") ? "bg-blue-600" : "bg-green-600"}`}>
                    {t.nombre.endsWith("A") ? "A" : "B"}
                  </div>
                  <span className="text-sm font-medium text-gray-900">{t.nombre}</span>
                  <span className="ml-auto text-xs text-gray-400">{t.departamentos.length} deptos.</span>
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>
          </>
        )}

        {paso === "depto" && torreSeleccionada && (
          <>
            <div>
              <button onClick={() => setPaso("torre")} className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
              <h2 className="mt-3 text-lg font-bold text-gray-900">{torreSeleccionada.nombre}</h2>
              <p className="text-sm text-gray-500 mt-1">Selecciona el departamento</p>
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="grid grid-cols-4 gap-2 max-h-64 overflow-y-auto">
              {torreSeleccionada.departamentos.map((d) => (
                <button key={d.id} onClick={() => handleSeleccionarDepto(d)}
                  className="border border-gray-200 rounded-lg py-2.5 text-sm font-medium text-gray-700 hover:border-blue-400 hover:bg-blue-50 transition-colors">
                  {d.numero || "—"}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>
          </>
        )}

        {paso === "meses" && deptoSeleccionado && (
          <>
            <div>
              <button onClick={() => { setPaso("depto"); setMesesSel([]); }} className="text-sm text-gray-400 hover:text-gray-600">← Volver</button>
              <h2 className="mt-3 text-lg font-bold text-gray-900">Depto. {deptoSeleccionado.numero || "Sin número"}</h2>
              <p className="text-sm text-gray-500 mt-1">Selecciona los meses a pagar</p>
            </div>
            <div className="space-y-2 max-h-64 overflow-y-auto">
              {meses.length === 0 ? (
                <p className="text-sm text-gray-400 text-center py-4">No hay meses pendientes.</p>
              ) : meses.map((m) => (
                <label key={m.key}
                  className={`flex items-center justify-between border rounded-lg px-4 py-3 cursor-pointer transition-colors
                    ${mesesSeleccionados.includes(m.key) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}>
                  <div className="flex items-center gap-3">
                    <input type="checkbox" checked={mesesSeleccionados.includes(m.key)}
                      onChange={() => toggleMes(m.key)} className="w-4 h-4 accent-gray-900" />
                    <span className="text-sm font-medium text-gray-700 capitalize">{m.label}</span>
                    {m.estadoPago === "ATRASADO" && (
                      <span className="text-xs bg-red-50 text-red-600 px-2 py-0.5 rounded-full">Atrasado</span>
                    )}
                  </div>
                  <span className="text-sm font-semibold text-gray-900">${m.monto.toLocaleString("es-CL")}</span>
                </label>
              ))}
            </div>
            {mesesSeleccionados.length > 0 && (
              <div className="bg-gray-50 rounded-lg px-4 py-3 flex items-center justify-between">
                <span className="text-sm text-gray-600">{mesesSeleccionados.length} mes{mesesSeleccionados.length !== 1 ? "es" : ""} seleccionado{mesesSeleccionados.length !== 1 ? "s" : ""}</span>
                <span className="text-sm font-bold text-gray-900">${totalSeleccionado.toLocaleString("es-CL")}</span>
              </div>
            )}
            <div className="flex gap-3">
              <button onClick={handleConfirmar} disabled={guardando || mesesSeleccionados.length === 0}
                className="flex-1 bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-700 disabled:opacity-40">
                {guardando ? "Registrando..." : "Confirmar pago"}
              </button>
              <button onClick={onClose}
                className="flex-1 border border-gray-200 text-sm text-gray-500 py-3 rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Página principal ───────────────────────────────────────
export default function GastosPage() {
  const [gastos, setGastos]           = useState<GastoDepto[]>([]);
  const [ultimosPagos, setUltimos]    = useState<UltimoPago[]>([]);
  const [stats, setStats]             = useState<Stats>({ totalDeptos: 0, pagados: 0, pendientes: 0, atrasados: 0, montoTotal: 0, montoPagado: 0 });
  const [config, setConfig]           = useState({ montoMensual: 0 });
  const [mes, setMes]                 = useState(getMesActual());
  const [cargando, setCargando]       = useState(true);
  const [pestana, setPestana]         = useState<"estado" | "historial">("estado");
  const [modalConfig, setModalConfig] = useState(false);
  const [modalPago, setModalPago]     = useState(false);
  const [generando, setGenerando]     = useState(false);
  const [nuevoMonto, setNuevoMonto]   = useState("");
  const [busquedaDepto, setBusquedaDepto] = useState("");
  const [totalDeptosOcupados, setTotalDeptosOcupados] = useState(0);
  const [generadoUnaVez, setGeneradoUnaVez] = useState(false);
  const cargar = useCallback(async () => {
    setCargando(true);
    const [resGastos, resUltimos] = await Promise.all([
      fetch(`/api/gastos?mes=${mes}`, { cache: "no-store" }).then((r) => r.json()),
      fetch("/api/gastos/ultimos-pagos", { cache: "no-store" }).then((r) => r.json()),
    ]);
    setGastos(resGastos.gastos ?? []);
    setStats(resGastos.stats ?? { totalDeptos: 0, pagados: 0, pendientes: 0, atrasados: 0, montoTotal: 0, montoPagado: 0 });
    setConfig(resGastos.config ?? { montoMensual: 0 });
    setNuevoMonto(String(resGastos.config?.montoMensual ?? 0));
    setTotalDeptosOcupados(resGastos.totalDepartamentosOcupados ?? 0);
    setUltimos(resUltimos.pagos ?? []);
    setCargando(false);
  }, [mes]);

  useEffect(() => { cargar(); }, [cargar]);
  useEffect(() => { setGeneradoUnaVez(false); }, [mes]);

  async function handleGenerarCobros() {
    if (config.montoMensual === 0) {
      alert("Define primero el monto mensual.");
      return;
    }

    if (generadoUnaVez) return;

    setGenerando(true);
    const res = await fetch("/api/gastos/generar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ mes }),
    });

    const data = await res.json();
    if (!res.ok) {
      alert(data.error ?? "No se pudo generar el cobro.");
    } else if (data.generados === 0) {
      alert(data.message ?? "No hay departamentos pendientes para generar este mes.");
      setGeneradoUnaVez(true);
    } else {
      setGeneradoUnaVez(true);
    }

    await cargar();
    setGenerando(false);
  }

  async function handleGuardarConfig() {
    const monto = parseFloat(nuevoMonto);
    if (isNaN(monto) || monto <= 0) return;
    await fetch("/api/gastos/config", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ montoMensual: monto }) });
    setModalConfig(false);
    await cargar();
  }

  async function handleDescargarPDFGastos() {
    if (!mes) return;
    window.open(`/api/reportes/gastos?mes=${mes}`, "_blank");
  }

  const estadoColor: Record<string, string> = {
    PAGADO:    "bg-green-50 text-green-700",
    PENDIENTE: "bg-yellow-50 text-yellow-700",
    ATRASADO:  "bg-red-50 text-red-700",
  };

  const gastosFiltrados = gastos.filter((g) =>
  busquedaDepto === "" || g.departamento.numero.includes(busquedaDepto)
  );

  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Gastos Comunes</h1>
          <p className="text-sm text-gray-500 mt-1">
            Monto mensual: <span className="font-semibold text-gray-900">
              {config.montoMensual > 0 ? `$${config.montoMensual.toLocaleString("es-CL")}` : "No definido"}
            </span>
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={() => setModalConfig(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            <Settings className="w-4 h-4" />Configurar monto
          </button>
          <button onClick={() => setModalPago(true)}
            className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
            <CreditCard className="w-4 h-4" />Registrar pago
          </button>
          <button onClick={handleGenerarCobros} disabled={generando || totalDeptosOcupados === 0 || stats.totalDeptos >= totalDeptosOcupados || generadoUnaVez}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700 disabled:opacity-40 disabled:cursor-not-allowed">
            <Receipt className="w-4 h-4" />
            {generando ? "Generando..." : generadoUnaVez || stats.totalDeptos >= totalDeptosOcupados ? "Cobros ya generados" : "Generar cobros del mes"}
          </button>
          <button onClick={handleDescargarPDFGastos}
            className="flex items-center gap-1.5 text-sm font-medium px-4 py-2.5 rounded-lg bg-gray-100 text-gray-700 hover:bg-gray-200 border border-gray-200 transition-colors">
            <FileDown className="w-4 h-4" />Generar reporte
          </button>
        </div>
      </div>

      {/* Selector mes */}
      <div className="flex items-center gap-3">
        <label className="text-sm font-medium text-gray-700">Período:</label>
        <input type="month" value={mes} onChange={(e) => setMes(e.target.value)}
          className="border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400">Total cobrado</p>
          <p className="text-xl font-bold text-gray-900 mt-1">${(stats.montoTotal ?? 0).toLocaleString("es-CL")}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.totalDeptos} departamentos</p>
        </div>
        <Link href={`/gastos/estado?estado=pagado&mes=${mes}`}
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer block">
          <div className="flex items-center gap-2 mb-1">
            <CheckCircle2 className="w-4 h-4 text-green-500" />
            <p className="text-xs text-gray-400">Pagado</p>
          </div>
          <p className="text-xl font-bold text-green-600">${(stats.montoPagado ?? 0).toLocaleString("es-CL")}</p>
          <p className="text-xs text-gray-400 mt-1">{stats.pagados} deptos. →</p>
        </Link>
        <Link href={`/gastos/estado?estado=pendiente&mes=${mes}`}
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer block">
          <div className="flex items-center gap-2 mb-1">
            <Clock className="w-4 h-4 text-yellow-500" />
            <p className="text-xs text-gray-400">Pendiente</p>
          </div>
          <p className="text-xl font-bold text-yellow-600">{stats.pendientes} deptos.</p>
          <p className="text-xs text-gray-400 mt-1">Ver lista →</p>
        </Link>
        <Link href={`/gastos/estado?estado=atrasado&mes=${mes}`}
          className="bg-white border border-gray-200 rounded-xl p-5 hover:shadow-md transition-all cursor-pointer block">
          <div className="flex items-center gap-2 mb-1">
            <AlertCircle className="w-4 h-4 text-red-500" />
            <p className="text-xs text-gray-400">Atrasado</p>
          </div>
          <p className="text-xl font-bold text-red-600">{stats.atrasados} deptos.</p>
          <p className="text-xs text-gray-400 mt-1">Ver lista →</p>
        </Link>
      </div>

      {/* Pestañas */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        {/* Tab headers */}
        <div className="flex border-b border-gray-100">
          <button
            onClick={() => setPestana("estado")}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px
              ${pestana === "estado"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"}`}>
            Estado del mes
          </button>
          <button
            onClick={() => setPestana("historial")}
            className={`px-6 py-4 text-sm font-medium transition-colors border-b-2 -mb-px
              ${pestana === "historial"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"}`}>
            Últimos pagos
          </button>
        </div>

        {/* Tab: Estado del mes */}
        {pestana === "estado" && (
          <>
            <div className="px-6 py-3 border-b border-gray-100">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <input
                  type="text"
                  value={busquedaDepto}
                  onChange={(e) => setBusquedaDepto(e.target.value.replace(/[^0-9]/g, ""))}
                  placeholder="Buscar por número de departamento..."
                  className="w-full border border-gray-200 rounded-lg pl-10 pr-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
                />
              </div>
            </div>
            {!cargando && gastosFiltrados.length === 0 ? (
              <div className="px-6 py-16 text-center space-y-2">
                <p className="text-sm text-gray-400">No hay cobros generados para este período.</p>
                <p className="text-xs text-gray-400">Presiona "Generar cobros del mes" para crear los registros.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Departamento</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Torre</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Monto</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Estado</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Fecha pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {gastosFiltrados.map((g, i) => (
                      <tr key={g.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-6 py-4 font-medium text-gray-900">{g.departamento.numero || "Sin número"}</td>
                        <td className="px-6 py-4 text-gray-500">{g.departamento.torre.nombre}</td>
                        <td className="px-6 py-4 text-gray-900">${g.monto.toLocaleString("es-CL")}</td>
                        <td className="px-6 py-4">
                          <span className={`inline-block text-xs font-medium px-2.5 py-1 rounded-full ${estadoColor[g.estadoPago]}`}>
                            {g.estadoPago.charAt(0) + g.estadoPago.slice(1).toLowerCase()}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-gray-500">
                          {g.fechaPago ? new Date(g.fechaPago).toLocaleDateString("es-CL") : "—"}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* Tab: Últimos pagos */}
        {pestana === "historial" && (
          <>
            {ultimosPagos.length === 0 ? (
              <div className="px-6 py-12 text-center text-sm text-gray-400">No hay pagos registrados aún.</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                 <thead>
                    <tr className="border-b border-gray-100 bg-gray-50">
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Departamento</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Torre</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Período</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Monto</th>
                      <th className="text-left px-6 py-3 font-medium text-gray-500">Fecha pago</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ultimosPagos.map((p, i) => (
                      <tr key={p.id} className={`border-b border-gray-100 last:border-0 ${i % 2 === 0 ? "" : "bg-gray-50/50"}`}>
                        <td className="px-6 py-4 font-medium text-gray-900">{p.departamento.numero || "Sin número"}</td>
                        <td className="px-6 py-4 text-gray-500">{p.departamento.torre.nombre}</td>
                        <td className="px-6 py-4 text-gray-500 capitalize">{formatMes(p.periodo)}</td>
                        <td className="px-6 py-4 text-gray-900">${p.monto.toLocaleString("es-CL")}</td>
                        <td className="px-6 py-4 text-gray-500">{p.fechaPago ? new Date(p.fechaPago).toLocaleDateString("es-CL") : "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}
      </div>

      {/* Modal configurar monto */}
      {modalConfig && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-900">Configurar monto mensual</h2>
              <p className="text-sm text-gray-500 mt-1">Este monto se aplicará a todos los departamentos.</p>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Monto mensual (CLP)</label>
              <input type="number" value={nuevoMonto} onChange={(e) => setNuevoMonto(e.target.value)}
                placeholder="Ej: 50000"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="flex gap-3">
              <button onClick={handleGuardarConfig}
                className="flex-1 bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-700">Guardar</button>
              <button onClick={() => setModalConfig(false)}
                className="flex-1 border border-gray-200 text-sm text-gray-500 py-3 rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </div>
        </div>
      )}

      {modalPago && (
        <ModalRegistrarPago onClose={() => setModalPago(false)} onPagado={cargar} />
      )}

    </div>
  );
}