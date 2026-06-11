import { useState } from 'react';
import type { PreventaCliente } from '../types/liquidacion';
import type { ClienteRegistrado } from '../types/clients';
import { ModalPickCliente } from './ModalPickCliente';

// ── Tarjeta de cliente en preventa ───────────────────────────

interface PreventaCardProps {
  preventa: PreventaCliente;
  onActualizar: (campos: Partial<Pick<PreventaCliente, 'notas' | 'visitado'>>) => void;
  onEliminar: () => void;
}

function PreventaCard({ preventa, onActualizar, onEliminar }: PreventaCardProps) {
  return (
    <div className={`bg-white rounded-2xl border shadow-sm p-4 space-y-3 transition-all ${
      preventa.visitado ? 'border-emerald-200 bg-emerald-50/30' : 'border-gray-100'
    }`}>

      {/* Nombre + toggle visitado + eliminar */}
      <div className="flex items-start gap-2">
        <div className="flex-1 min-w-0">
          <p className={`text-sm font-bold leading-tight ${preventa.visitado ? 'text-emerald-700 line-through' : 'text-gray-900'}`}>
            {preventa.nombre}
          </p>
          {preventa.ubicacion && (
            <p className="text-xs text-gray-400 mt-0.5">{preventa.ubicacion}</p>
          )}
        </div>

        <button
          onClick={() => onActualizar({ visitado: !preventa.visitado })}
          aria-label={preventa.visitado ? 'Marcar como no visitado' : 'Marcar como visitado'}
          className={`shrink-0 w-7 h-7 flex items-center justify-center rounded-full border-2 text-xs font-black transition-all ${
            preventa.visitado
              ? 'bg-emerald-500 border-emerald-500 text-white'
              : 'border-gray-300 text-gray-300 hover:border-emerald-400 hover:text-emerald-400'
          }`}
        >
          {preventa.visitado ? '✓' : ''}
        </button>

        <button
          onClick={onEliminar}
          aria-label={`Quitar a ${preventa.nombre}`}
          className="shrink-0 w-7 h-7 flex items-center justify-center rounded-full text-gray-300 hover:text-red-500 hover:bg-red-50 transition-colors text-sm"
        >
          &times;
        </button>
      </div>

      {/* Notas */}
      <textarea
        value={preventa.notas}
        placeholder="Notas de la visita (pedido planeado, observaciones...)"
        onChange={e => onActualizar({ notas: e.target.value })}
        rows={2}
        className="w-full text-xs text-gray-700 bg-gray-50 border border-gray-200 rounded-xl px-3 py-2 resize-none focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] placeholder-gray-300 transition"
      />
    </div>
  );
}

// ── Modulo de preventa ────────────────────────────────────────

interface Props {
  preventas: PreventaCliente[];
  clientes: ClienteRegistrado[];
  onAgregarPreventa: (cliente: ClienteRegistrado) => void;
  onActualizarPreventa: (id: string, campos: Partial<Pick<PreventaCliente, 'notas' | 'visitado'>>) => void;
  onEliminarPreventa: (id: string) => void;
}

export function PreventaModule({
  preventas,
  clientes,
  onAgregarPreventa,
  onActualizarPreventa,
  onEliminarPreventa,
}: Props) {
  const [modalAbierto, setModalAbierto] = useState(false);

  const visitados  = preventas.filter(p => p.visitado).length;
  const total      = preventas.length;
  const nombresYa  = preventas.map(p => p.nombre);

  return (
    <section className="space-y-3">

      {/* Encabezado */}
      <div className="flex items-center justify-between gap-2">
        <div>
          <h3 className="text-sm font-extrabold text-gray-600 uppercase tracking-wide">
            Ruta del dia
          </h3>
          {total > 0 && (
            <p className="text-xs text-gray-400 mt-0.5">
              {visitados} de {total} visitado{total !== 1 ? 's' : ''}
            </p>
          )}
        </div>
        <button
          onClick={() => setModalAbierto(true)}
          className="flex items-center gap-1 text-xs font-bold text-[#1a3a6b] hover:bg-blue-50 px-3 py-1.5 rounded-xl transition-colors"
        >
          <span className="text-base leading-none">+</span> Agregar cliente
        </button>
      </div>

      {/* Barra de progreso */}
      {total > 0 && (
        <div className="bg-gray-100 rounded-full h-1.5 overflow-hidden">
          <div
            className="bg-emerald-500 h-full rounded-full transition-all duration-500"
            style={{ width: `${total > 0 ? (visitados / total) * 100 : 0}%` }}
          />
        </div>
      )}

      {/* Estado vacio */}
      {total === 0 && (
        <div className="text-center py-8 text-gray-400">
          <p className="text-sm">Sin clientes en ruta</p>
          <p className="text-xs mt-1">Toca &ldquo;+ Agregar cliente&rdquo; para planificar tu ruta</p>
        </div>
      )}

      {/* Lista de tarjetas */}
      {preventas.map(p => (
        <PreventaCard
          key={p.id}
          preventa={p}
          onActualizar={campos => onActualizarPreventa(p.id, campos)}
          onEliminar={() => onEliminarPreventa(p.id)}
        />
      ))}

      {/* Modal de seleccion */}
      {modalAbierto && (
        <ModalPickCliente
          clientes={clientes}
          excluir={nombresYa}
          onSeleccionar={c => { onAgregarPreventa(c); setModalAbierto(false); }}
          onCerrar={() => setModalAbierto(false)}
        />
      )}
    </section>
  );
}
