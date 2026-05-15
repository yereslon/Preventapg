import { useState } from 'react';
import type { CatalogItem } from '../types/catalog';
import { formatSoles } from '../utils/format';

interface Props {
  item: CatalogItem;
  onAgregar: (item: CatalogItem, cantidad: number, precioOverride?: number, unidadOverride?: string, opcionIdx?: number) => void;
}

const CATEGORIA_COLORS: Record<string, { bg: string; text: string; dot: string }> = {};
const PALETTE = [
  { bg: 'bg-blue-50',   text: 'text-blue-700',   dot: 'bg-blue-400' },
  { bg: 'bg-amber-50',  text: 'text-amber-700',  dot: 'bg-amber-400' },
  { bg: 'bg-emerald-50',text: 'text-emerald-700',dot: 'bg-emerald-400' },
  { bg: 'bg-violet-50', text: 'text-violet-700', dot: 'bg-violet-400' },
  { bg: 'bg-rose-50',   text: 'text-rose-700',   dot: 'bg-rose-400' },
  { bg: 'bg-cyan-50',   text: 'text-cyan-700',   dot: 'bg-cyan-400' },
  { bg: 'bg-orange-50', text: 'text-orange-700', dot: 'bg-orange-400' },
];

function getCategoriaColor(categoria: string) {
  if (!CATEGORIA_COLORS[categoria]) {
    const idx = Object.keys(CATEGORIA_COLORS).length % PALETTE.length;
    CATEGORIA_COLORS[categoria] = PALETTE[idx];
  }
  return CATEGORIA_COLORS[categoria];
}

export function ProductCard({ item, onAgregar }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);
  const [selectedIdx, setSelectedIdx] = useState(0);

  const allOpciones = item.preciosExtra;
  const hasDropdown = allOpciones.length > 1;
  const selectedOpcion = allOpciones[selectedIdx] ?? allOpciones[0] ?? { unidad: item.unidad, precio: item.precio };

  const color = getCategoriaColor(item.categoria);

  function handleAgregar() {
    onAgregar(item, cantidad, selectedOpcion.precio, selectedOpcion.unidad, selectedIdx);
    setAgregado(true);
    setCantidad(1);
    setTimeout(() => setAgregado(false), 1500);
  }

  return (
    <div className="group bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">

      {/* Cuerpo */}
      <div className="flex flex-col flex-1 p-4 gap-3">

        {/* Categoría */}
        <div className="flex items-center gap-1.5">
          <span className={`inline-block w-1.5 h-1.5 rounded-full flex-shrink-0 ${color.dot}`} />
          <span className={`text-[10px] font-semibold uppercase tracking-wider truncate ${color.text}`}>
            {item.categoria}
          </span>
        </div>

        {/* Nombre */}
        <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-3 flex-1 min-h-[3rem]">
          {item.nombre}
        </h3>

        {/* Selector de unidad */}
        {hasDropdown ? (
          <div className="relative">
            <select
              value={selectedIdx}
              onChange={e => setSelectedIdx(Number(e.target.value))}
              className="w-full appearance-none text-xs font-medium border border-gray-200 rounded-lg px-3 py-2 pr-7 text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] transition cursor-pointer"
            >
              {allOpciones.map((op, i) => (
                <option key={i} value={i}>
                  {op.unidad}{op.precio > 0 ? ` — ${formatSoles(op.precio)}` : ''}
                </option>
              ))}
            </select>
            <span className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 text-[10px]">▾</span>
          </div>
        ) : (
          <p className="text-[11px] text-gray-400 font-medium">
            {selectedOpcion.unidad}
          </p>
        )}

        {/* Precio */}
        <div className="flex items-baseline gap-1">
          {selectedOpcion.precio > 0 ? (
            <>
              <span className="text-xl font-black text-[#c0392b] tracking-tight">
                {formatSoles(selectedOpcion.precio)}
              </span>
              {!hasDropdown && (
                <span className="text-[11px] text-gray-400">/ {selectedOpcion.unidad}</span>
              )}
            </>
          ) : (
            <span className="text-sm font-semibold text-gray-400 italic">Sin precio asignado</span>
          )}
        </div>

        {/* Controles */}
        <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
          {/* Cantidad */}
          <div className="flex items-center rounded-lg border border-gray-200 overflow-hidden bg-gray-50">
            <button
              onClick={() => setCantidad(q => Math.max(1, q - 1))}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors font-bold text-base leading-none"
            >
              −
            </button>
            <span className="w-7 text-center text-xs font-bold text-gray-800 select-none">
              {cantidad}
            </span>
            <button
              onClick={() => setCantidad(q => q + 1)}
              className="w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200 transition-colors font-bold text-base leading-none"
            >
              +
            </button>
          </div>

          {/* Agregar */}
          <button
            onClick={handleAgregar}
            className={`flex-1 h-7 rounded-lg text-xs font-bold tracking-wide transition-all duration-200 ${
              agregado
                ? 'bg-emerald-500 text-white'
                : 'bg-[#1a3a6b] hover:bg-[#2554a0] text-white'
            }`}
          >
            {agregado ? '✓ Agregado' : 'Agregar'}
          </button>
        </div>

      </div>
    </div>
  );
}
