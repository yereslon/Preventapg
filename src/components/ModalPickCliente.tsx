import { useState, useMemo } from 'react';
import type { ClienteRegistrado } from '../types/clients';

interface Props {
  clientes: ClienteRegistrado[];
  excluir?: string[];
  onSeleccionar: (cliente: ClienteRegistrado) => void;
  onCerrar: () => void;
}

function norm(s: string) {
  return s.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '');
}

export function ModalPickCliente({ clientes, excluir = [], onSeleccionar, onCerrar }: Props) {
  const [busqueda, setBusqueda] = useState('');

  const excluirSet = new Set(excluir.map(norm));

  const resultados = useMemo(() => {
    if (!busqueda.trim()) return clientes;
    const q = norm(busqueda);
    return clientes.filter(c => norm(c.nombre).includes(q));
  }, [clientes, busqueda]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/50 backdrop-blur-sm p-4"
      onClick={e => { if (e.target === e.currentTarget) onCerrar(); }}
    >
      <div className="bg-white rounded-3xl shadow-2xl w-full max-w-sm mb-2 overflow-hidden">

        <div className="bg-[#1a3a6b] px-5 py-4 flex items-center justify-between">
          <h2 className="text-white font-bold text-sm">Seleccionar cliente</h2>
          <button
            onClick={onCerrar}
            aria-label="Cerrar"
            className="text-white/60 hover:text-white text-xl leading-none transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="p-4 space-y-3">
          <input
            type="search"
            placeholder="Buscar por nombre..."
            value={busqueda}
            onChange={e => setBusqueda(e.target.value)}
            autoFocus
            className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm outline-none focus:ring-2 focus:ring-blue-100 focus:border-[#1a3a6b] transition"
          />

          <div className="space-y-1.5 max-h-64 overflow-y-auto">
            {resultados.length === 0 ? (
              <p className="text-center text-sm text-gray-400 py-6">Sin resultados</p>
            ) : resultados.map(c => {
              const yaEsta = excluirSet.has(norm(c.nombre));
              return (
                <button
                  key={c.nombre}
                  onClick={() => { if (!yaEsta) onSeleccionar(c); }}
                  disabled={yaEsta}
                  className={`w-full text-left px-3 py-2.5 rounded-xl border transition ${
                    yaEsta
                      ? 'border-gray-100 bg-gray-50 opacity-50 cursor-not-allowed'
                      : 'border-gray-100 hover:border-blue-200 hover:bg-blue-50 cursor-pointer active:scale-[0.98]'
                  }`}
                >
                  <p className="text-sm font-semibold text-gray-800 leading-tight">{c.nombre}</p>
                  {c.ubicacion && <p className="text-xs text-gray-400 mt-0.5">{c.ubicacion}</p>}
                  {yaEsta && <p className="text-[10px] text-blue-500 mt-0.5">Ya agregado</p>}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
