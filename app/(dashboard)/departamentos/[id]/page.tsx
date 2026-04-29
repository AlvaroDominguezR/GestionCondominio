"use client";

import Link from "next/link";
import { useState, useEffect, use } from "react";
import { Users, Plus, Trash2, AlertCircle, Pencil, UserCheck, Car, Check, X} from "lucide-react";
import { crearResidente, eliminarResidente, editarResidente, definirDuenoDesdeResidente, definirDuenoExterno, agregarVehiculo, eliminarVehiculo, actualizarDeudaAnterior } from "./actions";

type Vehiculo = {
  id: number;
  patente: string;
  tipo: string;
};

type Residente = {
  id: number;
  nombre: string;
  rut: string;
  telefono: string | null;
  esJefeHogar: boolean;
  vehiculos: Vehiculo[];
};

type Depto = {
  id: number;
  numero: string;
  tipoOcupacion: string;
  cantHabitantes: number;
  deudaAnterior: number;
  debeGastoComun: boolean;
  torre: { id: number; nombre: string; sector: string };
  dueno: { id: number; nombre: string; rut: string; telefono: string | null } | null;
  residentes: Residente[];
};

const TIPOS_VEHICULO = ["AUTO", "MOTO", "CAMIONETA", "FURGON", "OTRO"];

// ─── Modal Vehículo ─────────────────────────────────────────
function ModalVehiculo({ depto, onClose }: { depto: Depto; onClose: () => void }) {
  const [paso, setPaso] = useState<"residente" | "formulario">("residente");
  const [residenteSeleccionado, setResidenteSeleccionado] = useState<Residente | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!residenteSeleccionado) return;
    setError(null);
    setGuardando(true);
    const formData = new FormData(e.currentTarget);
    const result = await agregarVehiculo(residenteSeleccionado.id, depto.id, formData);
    if (result?.error) { setError(result.error); setGuardando(false); return; }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">

        {paso === "residente" ? (
          <>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Registrar vehículo</h2>
              <p className="text-sm text-gray-500 mt-1">¿A quién pertenece el vehículo?</p>
            </div>
            <div className="space-y-2">
              {depto.residentes.map((r) => (
                <button
                  key={r.id}
                  onClick={() => { setResidenteSeleccionado(r); setPaso("formulario"); }}
                  className="w-full flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left"
                >
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                    {r.nombre.charAt(0)}
                  </div>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-900">{r.nombre}</p>
                    <p className="text-xs text-gray-400">{r.vehiculos.length} vehículo{r.vehiculos.length !== 1 ? "s" : ""} registrado{r.vehiculos.length !== 1 ? "s" : ""}</p>
                  </div>
                  {r.esJefeHogar && <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">Jefe hogar</span>}
                </button>
              ))}
            </div>
            <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors">Cancelar</button>
          </>
        ) : (
          <>
            <div>
              <button onClick={() => setPaso("residente")} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">← Volver</button>
              <h2 className="mt-3 text-lg font-bold text-gray-900">Datos del vehículo</h2>
              <p className="text-sm text-gray-500 mt-1">Propietario: <span className="font-medium text-gray-700">{residenteSeleccionado?.nombre}</span></p>
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
                <AlertCircle className="w-4 h-4 shrink-0" />{error}
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Patente</label>
                <input name="patente" type="text" required placeholder="Ej: ABCD12"
                  className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm uppercase focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Tipo de vehículo</label>
                <div className="grid grid-cols-3 gap-2">
                  {TIPOS_VEHICULO.map((tipo) => (
                    <label key={tipo} className="flex items-center justify-center border border-gray-200 rounded-lg px-2 py-2.5 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 transition-colors">
                      <input type="radio" name="tipo" value={tipo} className="sr-only" defaultChecked={tipo === "AUTO"} />
                      <span className="text-xs font-medium text-gray-700">{tipo.charAt(0) + tipo.slice(1).toLowerCase()}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="submit" disabled={guardando}
                  className="flex-1 bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50">
                  {guardando ? "Guardando..." : "Registrar vehículo"}
                </button>
                <button type="button" onClick={onClose}
                  className="flex-1 border border-gray-200 text-sm text-gray-500 py-3 rounded-lg hover:bg-gray-50">Cancelar</button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
}

// ─── Modal Definir Dueño ────────────────────────────────────
function ModalDefinirDueno({ depto, onClose }: { depto: Depto; onClose: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const esDueno = depto.tipoOcupacion === "DUENO";

  async function handleSeleccionarResidente(residenteId: number) {
    setError(null);
    setGuardando(true);
    const result = await definirDuenoDesdeResidente(depto.id, residenteId);
    if (result?.error) { setError(result.error); setGuardando(false); return; }
    onClose();
  }

  async function handleSubmitExterno(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setGuardando(true);
    const result = await definirDuenoExterno(depto.id, new FormData(e.currentTarget));
    if (result?.error) { setError(result.error); setGuardando(false); return; }
    onClose();
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <div>
          <h2 className="text-lg font-bold text-gray-900">Definir dueño</h2>
          <p className="text-sm text-gray-500 mt-1">
            {esDueno ? "Selecciona cuál de los residentes es el propietario legal." : "Registra los datos del propietario legal del departamento."}
          </p>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        {esDueno ? (
          <div className="space-y-2">
            {depto.residentes.length === 0 ? (
              <p className="text-sm text-gray-400 text-center py-4">No hay residentes registrados aún.</p>
            ) : (
              depto.residentes.map((r) => (
                <button key={r.id} onClick={() => handleSeleccionarResidente(r.id)} disabled={guardando}
                  className="w-full flex items-center gap-3 border border-gray-200 rounded-xl px-4 py-3 hover:border-blue-400 hover:bg-blue-50 transition-colors text-left disabled:opacity-50">
                  <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600 shrink-0">
                    {r.nombre.charAt(0)}
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">{r.nombre}</p>
                    <p className="text-xs text-gray-400">{r.rut}</p>
                  </div>
                  {r.esJefeHogar && <span className="ml-auto text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">Jefe hogar</span>}
                </button>
              ))
            )}
            <button onClick={onClose} className="w-full text-sm text-gray-400 hover:text-gray-600 transition-colors pt-2">Cancelar</button>
          </div>
        ) : (
          <form onSubmit={handleSubmitExterno} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Nombre</label>
                <input name="nombre" type="text" required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium text-gray-700">Apellido</label>
                <input name="apellido" type="text" required className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
              </div>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">RUT</label>
              <input name="rut" type="text" required placeholder="12345678-9" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Teléfono <span className="text-gray-400">(opcional)</span></label>
              <input name="telefono" type="text" placeholder="+56 9 1234 5678" className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="flex gap-3 pt-2">
              <button type="submit" disabled={guardando} className="flex-1 bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50">
                {guardando ? "Guardando..." : "Registrar dueño"}
              </button>
              <button type="button" onClick={onClose} className="flex-1 border border-gray-200 text-sm text-gray-500 py-3 rounded-lg hover:bg-gray-50">Cancelar</button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}

// ─── Formulario residente ───────────────────────────────────
function FormResidente({ index, total, jefeAsignado, onSubmit, onCancel, guardando, error, defaultValues }: {
  index: number; total: number; jefeAsignado: boolean;
  onSubmit: (formData: FormData) => void; onCancel: () => void;
  guardando: boolean; error: string | null; defaultValues?: Residente;
}) {
  const [esJefe, setEsJefe] = useState(defaultValues?.esJefeHogar ?? false);
  const partes = defaultValues?.nombre.split(" ") ?? [];
  const nombre = partes[0] ?? "";
  const apellido = partes.slice(1).join(" ");

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-8 space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-lg font-bold text-gray-900">{defaultValues ? "Editar residente" : `Residente ${index + 1} de ${total}`}</h2>
            <p className="text-sm text-gray-500 mt-0.5">{defaultValues ? defaultValues.nombre : "Complete la información del habitante"}</p>
          </div>
          {!defaultValues && (
            <div className="flex gap-1">
              {Array.from({ length: total }).map((_, i) => (
                <div key={i} className={`w-2 h-2 rounded-full ${i <= index ? "bg-gray-900" : "bg-gray-200"}`} />
              ))}
            </div>
          )}
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); onSubmit(new FormData(e.currentTarget)); }} className="space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Nombre</label>
              <input name="nombre" type="text" required autoComplete="off" defaultValue={nombre}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Apellido</label>
              <input name="apellido" type="text" required autoComplete="off" defaultValue={apellido}
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
            </div>
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">RUT</label>
            <input name="rut" type="text" required placeholder="12345678-9" autoComplete="off" defaultValue={defaultValues?.rut ?? ""}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Teléfono <span className="text-gray-400">(opcional)</span></label>
            <input name="telefono" type="text" placeholder="+56 9 1234 5678" autoComplete="off" defaultValue={defaultValues?.telefono ?? ""}
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900" />
          </div>
          {!jefeAsignado && (
            <label className="flex items-center justify-between border border-gray-200 rounded-lg px-4 py-3 cursor-pointer">
              <div>
                <p className="text-sm font-medium text-gray-700">¿Es jefe de hogar?</p>
                <p className="text-xs text-gray-400">Solo puede haber uno por departamento</p>
              </div>
              <input type="checkbox" name="esJefeHogar" value="true"
                defaultChecked={defaultValues?.esJefeHogar ?? false}
                onChange={(e) => setEsJefe(e.target.checked)}
                className="w-4 h-4 accent-gray-900" />
            </label>
          )}
          {esJefe && (
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">¿El departamento es de dueño o arrendatario?</label>
              <div className="grid grid-cols-2 gap-2">
                <label className="flex items-center justify-center border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50 transition-colors">
                  <input type="radio" name="tipoOcupacion" value="DUENO" className="sr-only" defaultChecked />
                  <span className="text-sm font-medium text-gray-700">Dueño</span>
                </label>
                <label className="flex items-center justify-center border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer has-[:checked]:border-orange-400 has-[:checked]:bg-orange-50 transition-colors">
                  <input type="radio" name="tipoOcupacion" value="ARRENDATARIO" className="sr-only" />
                  <span className="text-sm font-medium text-gray-700">Arrendatario</span>
                </label>
              </div>
            </div>
          )}
          <div className="flex gap-3 pt-2">
            <button type="submit" disabled={guardando}
              className="flex-1 bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50">
              {guardando ? "Guardando..." : defaultValues ? "Guardar cambios" : index + 1 < total ? "Siguiente →" : "Finalizar"}
            </button>
            <button type="button" onClick={onCancel}
              className="flex-1 border border-gray-200 text-sm text-gray-500 py-3 rounded-lg hover:bg-gray-50">Cancelar</button>
          </div>
        </form>
      </div>
    </div>
  );
}

// ─── Modal Agregar Residentes ───────────────────────────────
function ModalAgregar({ depto, onClose }: { depto: Depto; onClose: () => void }) {
  const [paso, setPaso] = useState<"cantidad" | "formulario">("cantidad");
  const [cantidad, setCantidad] = useState(1);
  const [actual, setActual] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [jefeAsignado, setJefeAsignado] = useState(depto.residentes.some((r) => r.esJefeHogar));
  const espacioDisponible = 8 - depto.residentes.length;

  async function handleSubmit(formData: FormData) {
    setError(null);
    setGuardando(true);
    const esJefeHogar = formData.get("esJefeHogar") === "true";
    const result = await crearResidente(depto.id, formData);
    if (result?.error) { setError(result.error); setGuardando(false); return; }
    if (esJefeHogar) setJefeAsignado(true);
    setGuardando(false);
    const siguiente = actual + 1;
    if (siguiente < cantidad) { setActual(siguiente); setError(null); }
    else { onClose(); }
  }

  if (paso === "cantidad") {
    return (
      <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
        <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 space-y-6">
          <div>
            <h2 className="text-lg font-bold text-gray-900">Agregar residentes</h2>
            <p className="text-sm text-gray-500 mt-1">¿Cuántas personas viven en este departamento?</p>
          </div>
          {espacioDisponible === 0 ? (
            <p className="text-sm text-red-500">Este departamento ya tiene el máximo de 8 residentes.</p>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center gap-4 justify-center">
                <button onClick={() => setCantidad((c) => Math.max(1, c - 1))} className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 text-lg hover:bg-gray-50">−</button>
                <span className="text-3xl font-bold text-gray-900 w-8 text-center">{cantidad}</span>
                <button onClick={() => setCantidad((c) => Math.min(espacioDisponible, c + 1))} className="w-10 h-10 rounded-full border border-gray-200 text-gray-600 text-lg hover:bg-gray-50">+</button>
              </div>
              <p className="text-xs text-gray-400 text-center">Máximo {espacioDisponible} disponible{espacioDisponible !== 1 ? "s" : ""}</p>
              <div className="flex gap-3">
                <button onClick={() => { setPaso("formulario"); setActual(0); }} className="flex-1 bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-700">Continuar</button>
                <button onClick={onClose} className="flex-1 border border-gray-200 text-sm text-gray-500 py-3 rounded-lg hover:bg-gray-50">Cancelar</button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <FormResidente key={actual} index={actual} total={cantidad} jefeAsignado={jefeAsignado}
      onSubmit={handleSubmit} onCancel={onClose} guardando={guardando} error={error} />
  );
}

// ─── Página principal ───────────────────────────────────────
export default function DepartamentoPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [depto, setDepto]                         = useState<Depto | null>(null);
  const [modalAgregar, setModalAgregar]           = useState(false);
  const [modalDueno, setModalDueno]               = useState(false);
  const [modalVehiculo, setModalVehiculo]         = useState(false);
  const [residenteEditando, setResidenteEditando] = useState<Residente | null>(null);
  const [error, setError]                         = useState<string | null>(null);
  const [guardando, setGuardando]                 = useState(false);
  const [refresh, setRefresh]                     = useState(0);
  const [editandoDeuda, setEditandoDeuda]         = useState(false);
  const [deudaInput, setDeudaInput]               = useState("");

  useEffect(() => {
    fetch(`/api/departamentos/${id}`)
      .then((r) => r.json())
      .then(setDepto);
  }, [id, refresh]);

  if (!depto) return <div className="text-sm text-gray-400 p-8">Cargando...</div>;

  const jefeHogar    = depto.residentes.find((r) => r.esJefeHogar);
  const jefeAsignado = !!jefeHogar;
  const totalVehiculos = depto.residentes.reduce((acc, r) => acc + r.vehiculos.length, 0);

  async function handleEditarSubmit(formData: FormData) {
    if (!residenteEditando) return;
    setError(null);
    setGuardando(true);
    const result = await editarResidente(residenteEditando.id, depto!.id, formData);
    if (result?.error) { setError(result.error); setGuardando(false); return; }
    setResidenteEditando(null);
    setGuardando(false);
    setRefresh((n) => n + 1);
  }

  return (
    <div className="space-y-8">
      <div>
        <Link href={`/torres/${depto.torre.id}`} className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Volver a {depto.torre.nombre}
        </Link>
        <div className="mt-3 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Departamento {depto.numero || "Sin número"}</h1>
            <p className="text-sm text-gray-500 mt-1">{depto.torre.nombre} · Sector {depto.torre.sector}</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setModalDueno(true)}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors">
              <UserCheck className="w-4 h-4" />
              {depto.dueno ? "Cambiar dueño" : "Definir dueño"}
            </button>
            <button
              onClick={() => { if (depto.residentes.length === 0) return; setModalVehiculo(true); }}
              disabled={depto.residentes.length === 0}
              title={depto.residentes.length === 0 ? "Registra residentes primero" : ""}
              className="flex items-center gap-2 border border-gray-200 text-gray-700 text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <Car className="w-4 h-4" />Agregar vehículo
            </button>
            {depto.residentes.length < 8 && (
              <button onClick={() => setModalAgregar(true)}
                className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-4 py-2.5 rounded-lg hover:bg-gray-700">
                <Plus className="w-4 h-4" />Agregar residentes
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Tarjetas */}
      <div className="grid grid-cols-1 sm:grid-cols-5 gap-4">
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Tipo de ocupación</p>
          <span className={`inline-block text-sm font-semibold px-3 py-1 rounded-full ${depto.tipoOcupacion === "DUENO" ? "bg-blue-50 text-blue-700" : "bg-orange-50 text-orange-700"}`}>
            {depto.tipoOcupacion === "DUENO" ? "Dueño" : "Arrendatario"}
          </span>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Dueño legal</p>
          <p className="text-sm font-semibold text-gray-900">{depto.dueno?.nombre ?? "—"}</p>
          {depto.dueno?.telefono && <p className="text-xs text-gray-400 mt-0.5">{depto.dueno.telefono}</p>}
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Jefe de hogar</p>
          <p className="text-sm font-semibold text-gray-900">{jefeHogar?.nombre ?? "—"}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Vehículos registrados</p>
          <p className="text-sm font-semibold text-gray-900">{totalVehiculos}</p>
        </div>
        <div className="bg-white border border-gray-200 rounded-xl p-5">
          <p className="text-xs text-gray-400 mb-1">Deuda anterior al sistema</p>
          {editandoDeuda ? (
            <div className="flex items-center gap-2 mt-1">
              <input
                type="number"
                value={deudaInput}
                onChange={(e) => setDeudaInput(e.target.value)}
                className="w-full border border-blue-400 rounded-md px-2 py-1 text-sm focus:outline-none"
                placeholder="0"
              />
              <button onClick={async () => {
                await actualizarDeudaAnterior(depto.id, parseFloat(deudaInput) || 0);
                setEditandoDeuda(false);
                setRefresh((n) => n + 1);
              }} className="text-green-600 hover:text-green-800">
                <Check className="w-4 h-4" />
              </button>
              <button onClick={() => setEditandoDeuda(false)} className="text-red-400 hover:text-red-600">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mt-1">
              <p className={`text-sm font-semibold ${depto.deudaAnterior > 0 ? "text-red-600" : "text-gray-900"}`}>
                {depto.deudaAnterior > 0 ? `$${depto.deudaAnterior.toLocaleString("es-CL")}` : "Sin deuda"}
              </p>
              <button onClick={() => { setDeudaInput(String(depto.deudaAnterior)); setEditandoDeuda(true); }}
                className="text-gray-300 hover:text-gray-600">
                <Pencil className="w-3 h-3" />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista residentes */}
      <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-100 flex items-center justify-between">
          <div>
            <h2 className="font-semibold text-gray-900">Residentes</h2>
            <p className="text-xs text-gray-400 mt-0.5">{depto.residentes.length} de 8 registrados</p>
          </div>
          <Users className="w-4 h-4 text-gray-400" />
        </div>
        {depto.residentes.length === 0 ? (
          <div className="px-6 py-12 text-center text-sm text-gray-400">No hay residentes registrados.</div>
        ) : (
          <div className="divide-y divide-gray-100">
            {depto.residentes.map((r) => (
              <div key={r.id} className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-gray-100 flex items-center justify-center text-xs font-semibold text-gray-600">
                      {r.nombre.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="text-sm font-medium text-gray-900">{r.nombre}</p>
                        {r.esJefeHogar && <span className="text-xs bg-gray-900 text-white px-2 py-0.5 rounded-full">Jefe hogar</span>}
                      </div>
                      <p className="text-xs text-gray-400">{r.rut} · {r.telefono ?? "Sin teléfono"}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button onClick={() => { setError(null); setResidenteEditando(r); }}
                      className="p-1.5 text-gray-400 hover:text-blue-600 transition-colors">
                      <Pencil className="w-4 h-4" />
                    </button>
                    <button onClick={async () => { await eliminarResidente(r.id, depto.id); setRefresh((n) => n + 1); }}
                      className="p-1.5 text-gray-400 hover:text-red-600 transition-colors">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>

                {/* Vehículos del residente */}
                {r.vehiculos.length > 0 && (
                  <div className="mt-2 ml-11 space-y-1">
                    {r.vehiculos.map((v) => (
                      <div key={v.id} className="flex items-center gap-2">
                        <Car className="w-3 h-3 text-gray-400" />
                        <span className="text-xs font-medium text-gray-700">{v.patente}</span>
                        <span className="text-xs text-gray-400">{v.tipo.charAt(0) + v.tipo.slice(1).toLowerCase()}</span>
                        <button onClick={async () => { await eliminarVehiculo(v.id, depto.id); setRefresh((n) => n + 1); }}
                          className="ml-auto text-red-400 hover:text-red-600 transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {modalAgregar && <ModalAgregar depto={depto} onClose={() => { setModalAgregar(false); setRefresh((n) => n + 1); }} />}
      {modalDueno && <ModalDefinirDueno depto={depto} onClose={() => { setModalDueno(false); setRefresh((n) => n + 1); }} />}
      {modalVehiculo && <ModalVehiculo depto={depto} onClose={() => { setModalVehiculo(false); setRefresh((n) => n + 1); }} />}
      {residenteEditando && (
        <FormResidente key={residenteEditando.id} index={0} total={1}
          jefeAsignado={jefeAsignado && !residenteEditando.esJefeHogar}
          onSubmit={handleEditarSubmit}
          onCancel={() => { setResidenteEditando(null); setError(null); }}
          guardando={guardando} error={error} defaultValues={residenteEditando} />
      )}
    </div>
  );
}