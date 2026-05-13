"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Building2, Users, Car, TrendingUp, TrendingDown, Plus, Trash2, Bell, X } from "lucide-react";

type Stats = { totalDeptos: number; deptosOcupados: number; totalHabitantes: number; totalVehiculos: number };
type Balance = { gastosPagados: number; ingresosManuales: number; egresos: number; balance: number; pendientes: number; atrasados: number };
type Movimiento = { id: number; monto: number; periodo: string; departamento: { numero: string; torre: { nombre: string } } };
type Aviso = { id: number; titulo: string; descripcion: string | null; fecha: string };

function formatMes(periodo: string) {
  // periodo puede ser '2026-05' o un string ISO
  let date: Date;
  if (/^\d{4}-\d{2}$/.test(periodo)) {
    // '2026-05'
    date = new Date(Date.UTC(Number(periodo.slice(0,4)), Number(periodo.slice(5,7))-1, 1));
  } else {
    // ISO string
    date = new Date(periodo);
  }
  const meses = ["Enero","Febrero","Marzo","Abril","Mayo","Junio","Julio","Agosto","Septiembre","Octubre","Noviembre","Diciembre"];
  return `${meses[date.getUTCMonth()]} ${date.getUTCFullYear()}`;
}

function formatFecha(fecha: string) {
  return new Date(fecha).toLocaleDateString("es-CL", { weekday: "short", day: "numeric", month: "short" });
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
              placeholder={tipo === "ingreso" ? "Ej: Aporte municipalidad" : "Ej: Arreglo sala de bombas"}
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

// ─── Modal Aviso ────────────────────────────────────────────
function ModalAviso({ onClose, onGuardado }: { onClose: () => void; onGuardado: () => void }) {
  const [titulo, setTitulo]           = useState("");
  const [descripcion, setDescripcion] = useState("");
  const [fecha, setFecha]             = useState(new Date().toISOString().split("T")[0]);
  const [guardando, setGuardando]     = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setGuardando(true);
    await fetch("/api/avisos", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ titulo, descripcion, fecha }),
    });
    onGuardado();
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Nuevo aviso</h2>
          <p className="text-sm text-gray-500 mt-1">Agrega un recordatorio o evento</p>
        </div>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Título</label>
            <input value={titulo} onChange={(e) => setTitulo(e.target.value)} required
              placeholder="Ej: Reunión de propietarios"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Descripción <span className="text-gray-400">(opcional)</span></label>
            <input value={descripcion} onChange={(e) => setDescripcion(e.target.value)}
              placeholder="Ej: Sala multiuso, 19:00 hrs"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Fecha</label>
            <input type="date" value={fecha} onChange={(e) => setFecha(e.target.value)} required
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={guardando}
              className="flex-1 bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50">
              {guardando ? "Guardando..." : "Guardar aviso"}
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
export default function DashboardPage() {
  const [stats, setStats]           = useState<Stats>({ totalDeptos: 0, deptosOcupados: 0, totalHabitantes: 0, totalVehiculos: 0 });
  const [balance, setBalance]       = useState<Balance>({ gastosPagados: 0, ingresosManuales: 0, egresos: 0, balance: 0, pendientes: 0, atrasados: 0 });
  const [movimientos, setMovimientos] = useState<Movimiento[]>([]);
  const [avisos, setAvisos]         = useState<Aviso[]>([]);
  const [avisosSemana, setAvisosSemana] = useState<Aviso[]>([]);
  const [modalTipo, setModalTipo]   = useState<"ingreso" | "egreso" | null>(null);
  const [modalAviso, setModalAviso] = useState(false);
  const [refresh, setRefresh]       = useState(0);

  useEffect(() => {
    fetch("/api/dashboard")
      .then((r) => r.json())
      .then((data) => {
        setStats(data.stats);
        setBalance(data.balance);
        setMovimientos(data.ultimosMovimientos);
        setAvisos(data.avisosProximos);
        setAvisosSemana(data.avisosSemana);
      });
  }, [refresh]);

  async function eliminarAviso(id: number) {
    await fetch("/api/avisos", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    setRefresh((n) => n + 1);
  }

  const mesActual = new Date().toLocaleDateString("es-CL", { month: "long", year: "numeric" });

  return (
    <div className="space-y-8">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Inicio</h1>
        <p className="text-sm text-gray-500 mt-1">Resumen general del condominio</p>
      </div>

      {/* Avisos de la semana */}
      {avisosSemana.length > 0 && (
        <div className="bg-blue-50 border border-blue-200 rounded-xl px-5 py-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <Bell className="w-4 h-4 text-blue-600" />
            <p className="text-sm font-semibold text-blue-800">Eventos esta semana</p>
          </div>
          {avisosSemana.map((a) => (
            <div key={a.id} className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-medium text-blue-900">{a.titulo}</p>
                {a.descripcion && <p className="text-xs text-blue-600">{a.descripcion}</p>}
                <p className="text-xs text-blue-500 mt-0.5">{formatFecha(a.fecha)}</p>
              </div>
              <button onClick={() => eliminarAviso(a.id)} className="text-blue-400 hover:text-blue-700 shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>
      )}

      {/* Tarjetas stats */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">Departamentos</p>
            <div className="w-8 h-8 bg-blue-50 rounded-lg flex items-center justify-center">
              <Building2 className="w-4 h-4 text-blue-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.deptosOcupados}</p>
          <p className="text-xs text-gray-400 mt-1">de {stats.totalDeptos} ocupados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">Habitantes</p>
            <div className="w-8 h-8 bg-green-50 rounded-lg flex items-center justify-center">
              <Users className="w-4 h-4 text-green-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalHabitantes}</p>
          <p className="text-xs text-gray-400 mt-1">registrados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">Vehículos</p>
            <div className="w-8 h-8 bg-purple-50 rounded-lg flex items-center justify-center">
              <Car className="w-4 h-4 text-purple-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-gray-900">{stats.totalVehiculos}</p>
          <p className="text-xs text-gray-400 mt-1">registrados</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <div className="flex items-center justify-between mb-3">
            <p className="text-xs text-gray-400">Gastos pendientes</p>
            <div className="w-8 h-8 bg-yellow-50 rounded-lg flex items-center justify-center">
              <Bell className="w-4 h-4 text-yellow-600" />
            </div>
          </div>
          <p className="text-2xl font-bold text-yellow-600">{balance.pendientes}</p>
          <p className="text-xs text-gray-400 mt-1">{balance.atrasados} atrasados</p>
        </div>
      </div>

      {/* Balance del mes */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Balance del mes</h2>
            <p className="text-xs text-gray-400 mt-0.5 capitalize">{mesActual}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setModalTipo("ingreso")}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-green-50 text-green-700 hover:bg-green-100 transition-colors">
              <Plus className="w-3.5 h-3.5" />Ingreso
            </button>
            <button onClick={() => setModalTipo("egreso")}
              className="flex items-center gap-1.5 text-xs font-medium px-3 py-2 rounded-lg bg-red-50 text-red-600 hover:bg-red-100 transition-colors">
              <Plus className="w-3.5 h-3.5" />Egreso
            </button>
          </div>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-gray-100">
          <div className="px-6 py-5">
            <p className="text-xs text-gray-400 mb-1">Gastos comunes cobrados</p>
            <p className="text-lg font-bold text-green-600">${balance.gastosPagados.toLocaleString("es-CL")}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs text-gray-400 mb-1">Otros ingresos</p>
            <p className="text-lg font-bold text-green-600">${balance.ingresosManuales.toLocaleString("es-CL")}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs text-gray-400 mb-1">Egresos</p>
            <p className="text-lg font-bold text-red-500">${balance.egresos.toLocaleString("es-CL")}</p>
          </div>
          <div className="px-6 py-5">
            <p className="text-xs text-gray-400 mb-1">Balance neto</p>
            <p className={`text-lg font-bold ${balance.balance >= 0 ? "text-gray-900" : "text-red-600"}`}>
              ${balance.balance.toLocaleString("es-CL")}
            </p>
          </div>
        </div>
      </div>

      {/* Últimos movimientos + Avisos */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">

        {/* Últimos pagos */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Últimos gastos comunes pagados</h2>
            <Link href="/gastos" className="text-xs text-blue-600 hover:text-blue-800">Ver todos →</Link>
          </div>
          {movimientos.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">Sin movimientos aún.</div>
          ) : (
            <div className="divide-y divide-gray-100">
              {movimientos.map((m) => (
                <div key={m.id} className="px-6 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      Depto. {m.departamento.numero || "S/N"}
                      <span className="ml-2 text-xs text-gray-400 font-normal">{m.departamento.torre.nombre}</span>
                    </p>
                    <p className="text-xs text-gray-400 capitalize">{formatMes(m.periodo)}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <p className="text-sm font-semibold text-gray-900">${m.monto.toLocaleString("es-CL")}</p>
                    <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">Pagado</span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Avisos / Recordatorios */}
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">Avisos y recordatorios</h2>
            <button onClick={() => setModalAviso(true)}
              className="flex items-center gap-1.5 text-xs font-medium text-gray-600 hover:text-gray-900 transition-colors">
              <Plus className="w-3.5 h-3.5" />Nuevo
            </button>
          </div>
          {avisos.length === 0 ? (
            <div className="px-6 py-10 text-center text-sm text-gray-400">
              No hay avisos para esta semana.
            </div>
          ) : (
            <div className="divide-y divide-gray-100">
              {avisos.map((a) => (
                <div key={a.id} className="px-6 py-3 flex items-start justify-between gap-3">
                  <div>
                    <p className="text-sm font-medium text-gray-900">{a.titulo}</p>
                    {a.descripcion && <p className="text-xs text-gray-500">{a.descripcion}</p>}
                    <p className="text-xs text-gray-400 mt-0.5">{formatFecha(a.fecha)}</p>
                  </div>
                  <button onClick={() => eliminarAviso(a.id)} className="text-gray-300 hover:text-red-500 transition-colors shrink-0">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {modalTipo && (
        <ModalMovimiento tipo={modalTipo} onClose={() => setModalTipo(null)} onGuardado={() => setRefresh((n) => n + 1)} />
      )}
      {modalAviso && (
        <ModalAviso onClose={() => setModalAviso(false)} onGuardado={() => setRefresh((n) => n + 1)} />
      )}

    </div>
  );
}