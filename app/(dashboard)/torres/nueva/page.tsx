"use client";
 
import Link from "next/link";
import { crearTorre } from "../actions";
import { useState } from "react";
 
const todasA = Array.from({ length: 9 }, (_, i) => `${i + 1}|A`);
const todasB = Array.from({ length: 9 }, (_, i) => `${i + 1}|B`);
 
export default function NuevaTorrePage() {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
 
  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    const formData = new FormData(e.currentTarget);
    const result = await crearTorre(formData);
    if (result?.error) {
      setError(result.error);
      setLoading(false);
    }
  }
 
  return (
    <div className="max-w-md space-y-8">
      <div>
        <Link href="/torres" className="text-sm text-gray-400 hover:text-gray-600 transition-colors">
          ← Volver a torres
        </Link>
        <h1 className="mt-4 text-2xl font-bold text-gray-900">Nueva torre</h1>
        <p className="text-sm text-gray-500 mt-1">
          Se crearán 16 departamentos vacíos automáticamente.
        </p>
      </div>
 
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 text-sm px-4 py-3 rounded-lg">
          {error}
        </div>
      )}
 
      <form onSubmit={handleSubmit} className="bg-white border border-gray-200 rounded-xl p-8 space-y-6">
 
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Sector A</label>
          <div className="grid grid-cols-3 gap-2">
            {todasA.map((val) => {
              const num = val.split("|")[0];
              return (
                <label
                  key={val}
                  className="flex items-center justify-center border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer hover:border-blue-400 transition-colors has-[:checked]:border-blue-600 has-[:checked]:bg-blue-50"
                >
                  <input type="radio" name="torre" value={val} className="sr-only" />
                  <span className="text-sm font-medium text-gray-700">Torre {num}A</span>
                </label>
              );
            })}
          </div>
        </div>
 
        <div className="space-y-2">
          <label className="block text-sm font-medium text-gray-700">Sector B</label>
          <div className="grid grid-cols-3 gap-2">
            {todasB.map((val) => {
              const num = val.split("|")[0];
              return (
                <label
                  key={val}
                  className="flex items-center justify-center border border-gray-200 rounded-lg px-3 py-2.5 cursor-pointer hover:border-green-400 transition-colors has-[:checked]:border-green-600 has-[:checked]:bg-green-50"
                >
                  <input type="radio" name="torre" value={val} className="sr-only" />
                  <span className="text-sm font-medium text-gray-700">Torre {num}B</span>
                </label>
              );
            })}
          </div>
        </div>
 
        <div className="flex items-center gap-3 pt-2">
          <button
            type="submit"
            disabled={loading}
            className="bg-gray-900 text-white text-sm font-medium px-6 py-3 rounded-lg hover:bg-gray-700 transition-colors disabled:opacity-50"
          >
            {loading ? "Creando..." : "Crear torre"}
          </button>
          <Link href="/torres" className="text-sm text-gray-500 hover:text-gray-700 transition-colors">
            Cancelar
          </Link>
        </div>
 
      </form>
    </div>
  );
}