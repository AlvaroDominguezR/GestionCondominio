"use client";

import { useState, useEffect } from "react";
import { Building2, Save } from "lucide-react";

type Perfil = {
  id: number;
  nombre: string;
  direccion: string;
  comuna: string;
  ciudad: string;
  telefono: string;
  email: string;
};

export default function PerfilPage() {
  const [perfil, setPerfil]       = useState<Perfil | null>(null);
  const [guardando, setGuardando] = useState(false);
  const [guardado, setGuardado]   = useState(false);

  useEffect(() => {
    fetch("/api/perfil")
      .then((r) => r.json())
      .then((data) => setPerfil(data.perfil));
  }, []);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    if (!perfil) return;
    setGuardando(true);
    await fetch("/api/perfil", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(perfil),
    });
    setGuardando(false);
    setGuardado(true);
    setTimeout(() => setGuardado(false), 3000);
  }

  if (!perfil) return <div className="text-sm text-gray-400 p-8">Cargando...</div>;

  return (
    <div className="space-y-8 max-w-2xl">

      {/* Encabezado */}
      <div>
        <h1 className="text-2xl font-bold text-gray-900">Perfil del condominio</h1>
        <p className="text-sm text-gray-500 mt-1">
          Esta información aparecerá en los reportes y documentos generados.
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-6">

        {/* Ícono */}
        <div className="flex items-center gap-4">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center">
            <Building2 className="w-8 h-8 text-white" />
          </div>
          <div>
            <p className="font-semibold text-gray-900">{perfil.nombre || "Sin nombre"}</p>
            <p className="text-sm text-gray-400">{perfil.direccion || "Sin dirección"}</p>
          </div>
        </div>

        {/* Formulario */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 space-y-5">
          <h2 className="font-semibold text-gray-900 pb-2 border-b border-gray-100">
            Información general
          </h2>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Nombre del condominio</label>
            <input
              value={perfil.nombre}
              onChange={(e) => setPerfil({ ...perfil, nombre: e.target.value })}
              placeholder="Ej: Condominio Los Aromos"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">Dirección</label>
            <input
              value={perfil.direccion}
              onChange={(e) => setPerfil({ ...perfil, direccion: e.target.value })}
              placeholder="Ej: Av. Principal 1234"
              className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Comuna</label>
              <input
                value={perfil.comuna}
                onChange={(e) => setPerfil({ ...perfil, comuna: e.target.value })}
                placeholder="Ej: Maipú"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Ciudad</label>
              <input
                value={perfil.ciudad}
                onChange={(e) => setPerfil({ ...perfil, ciudad: e.target.value })}
                placeholder="Ej: Santiago"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Teléfono</label>
              <input
                value={perfil.telefono}
                onChange={(e) => setPerfil({ ...perfil, telefono: e.target.value })}
                placeholder="Ej: +56 2 1234 5678"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-medium text-gray-700">Email</label>
              <input
                type="email"
                value={perfil.email}
                onChange={(e) => setPerfil({ ...perfil, email: e.target.value })}
                placeholder="Ej: admin@condominio.cl"
                className="w-full border border-gray-200 rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-gray-900"
              />
            </div>
          </div>
        </div>

        {/* Botón guardar */}
        <div className="flex items-center gap-3">
          <button
            type="submit"
            disabled={guardando}
            className="flex items-center gap-2 bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors"
          >
            <Save className="w-4 h-4" />
            {guardando ? "Guardando..." : "Guardar cambios"}
          </button>
          {guardado && (
            <p className="text-sm text-green-600 font-medium">✓ Cambios guardados</p>
          )}
        </div>

      </form>
    </div>
  );
}