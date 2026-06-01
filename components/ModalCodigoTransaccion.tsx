"use client";

import { useState } from "react";
import { AlertCircle, Hash } from "lucide-react";

interface Props {
  onConfirm: (codigo: string) => void;
  onCancel: () => void;
  loading?: boolean;
  textoBoton?: string;
}

export function ModalCodigoTransaccion({ onConfirm, onCancel, loading, textoBoton = "Confirmar pago" }: Props) {
  const [codigo, setCodigo] = useState("");
  const [error, setError]   = useState<string | null>(null);

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (codigo.trim().length === 0) {
      setError("Ingresa el código de la transacción.");
      return;
    }
    onConfirm(codigo.toUpperCase());
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-xl w-full max-w-sm p-8 space-y-6">
        <div className="flex items-start gap-3">
          <div className="w-10 h-10 rounded-xl bg-green-50 flex items-center justify-center shrink-0">
            <Hash className="w-5 h-5 text-green-600" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-gray-900">Código de transacción</h2>
            <p className="text-sm text-gray-500 mt-1">
              Ingresa los últimos 4 caracteres del comprobante de transferencia.
            </p>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />{error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-medium text-gray-700">
              Código <span className="text-gray-400">(letras y/o números, máx. 4)</span>
            </label>
            <input
              value={codigo}
              onChange={(e) => { setCodigo(e.target.value.toUpperCase()); setError(null); }}
              onKeyDown={(e) => {
                if (
                  !/[a-zA-Z0-9]/.test(e.key) &&
                  e.key !== "Backspace" &&
                  e.key !== "Delete" &&
                  e.key !== "Tab"
                ) e.preventDefault();
              }}
              maxLength={4}
              placeholder="Ej: AB12"
              autoFocus
              className="w-full border border-gray-200 rounded-lg px-3 py-3 text-xl font-mono tracking-[0.3em] text-center uppercase focus:outline-none focus:ring-2 focus:ring-gray-900"
            />
            <p className="text-xs text-gray-400 text-right">{codigo.length}/4 caracteres</p>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={loading || codigo.length === 0}
              className="flex-1 bg-gray-900 text-white text-sm font-medium py-3 rounded-lg hover:bg-gray-700 disabled:opacity-50 transition-colors">
              {loading ? "Registrando..." : textoBoton}
            </button>
            <button
              type="button"
              onClick={onCancel}
              disabled={loading}
              className="flex-1 border border-gray-200 text-sm text-gray-500 py-3 rounded-lg hover:bg-gray-50 transition-colors">
              Cancelar
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
