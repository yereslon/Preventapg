import { useState, useEffect } from 'react';
import type { CatalogItem } from '../types/catalog';
import { formatSoles } from '../utils/format';

interface Props {
  item: CatalogItem;
  onAgregar: (item: CatalogItem, cantidad: number, precioOverride?: number, unidadOverride?: string, opcionIdx?: number, nota?: string) => void;
}

const CATEGORIA_COLORS: Record<string, { bg: string; text: string; dot: string }> = {};
const PALETTE = [
  { bg: 'bg-blue-50',    text: 'text-blue-700',    dot: 'bg-blue-400' },
  { bg: 'bg-amber-50',   text: 'text-amber-700',   dot: 'bg-amber-400' },
  { bg: 'bg-emerald-50', text: 'text-emerald-700', dot: 'bg-emerald-400' },
  { bg: 'bg-violet-50',  text: 'text-violet-700',  dot: 'bg-violet-400' },
  { bg: 'bg-rose-50',    text: 'text-rose-700',    dot: 'bg-rose-400' },
  { bg: 'bg-cyan-50',    text: 'text-cyan-700',    dot: 'bg-cyan-400' },
  { bg: 'bg-orange-50',  text: 'text-orange-700',  dot: 'bg-orange-400' },
];

function getCategoriaColor(categoria: string) {
  if (!CATEGORIA_COLORS[categoria]) {
    const idx = Object.keys(CATEGORIA_COLORS).length % PALETTE.length;
    CATEGORIA_COLORS[categoria] = PALETTE[idx];
  }
  return CATEGORIA_COLORS[categoria];
}

/* ── Tarjeta simplificada ─────────────────────────────── */
export function ProductCard({ item, onAgregar }: Props) {
  const [modalOpen, setModalOpen] = useState(false);
  const color = getCategoriaColor(item.categoria);

  return (
    <>
      <div className="bg-white rounded-2xl border border-gray-100 shadow-sm hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 flex flex-col overflow-hidden">
        <div className="flex flex-col flex-1 p-4 gap-2">
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
        </div>

        {/* Botón agregar */}
        <div className="px-3 pb-3">
          <button
            onClick={() => setModalOpen(true)}
            className="w-full py-2.5 rounded-xl bg-[#1a3a6b] hover:bg-[#2554a0] text-white text-sm font-bold tracking-wide transition-colors duration-200"
          >
            Agregar
          </button>
        </div>
      </div>

      {modalOpen && (
        <ProductModal
          item={item}
          color={color}
          onClose={() => setModalOpen(false)}
          onAgregar={(it, cant, precio, unidad, idx) => {
            onAgregar(it, cant, precio, unidad, idx);
            setModalOpen(false);
          }}
        />
      )}
    </>
  );
}

/* ── Modal de detalle ────────────────────────────────── */
interface ModalProps {
  item: CatalogItem;
  color: { bg: string; text: string; dot: string };
  onClose: () => void;
  onAgregar: (item: CatalogItem, cantidad: number, precioOverride?: number, unidadOverride?: string, opcionIdx?: number, nota?: string) => void;
}

function ProductModal({ item, color, onClose, onAgregar }: ModalProps) {
  const allOpciones = item.preciosExtra;
  const hasDropdown = allOpciones.length > 1;

  const [selectedIdx, setSelectedIdx] = useState(0);
  const [cantidad, setCantidad] = useState(1);
  const [cantidadRaw, setCantidadRaw] = useState('1');
  const [precioInput, setPrecioInput] = useState('');
  const [nota, setNota] = useState('');
  const [agregado, setAgregado] = useState(false);

  const selectedOpcion = allOpciones[selectedIdx] ?? { unidad: item.unidad, precio: item.precio };

  // Sync precio input when unit changes
  useEffect(() => {
    setPrecioInput(selectedOpcion.precio > 0 ? String(selectedOpcion.precio) : '');
  }, [selectedIdx, selectedOpcion.precio]);

  function handleUnitChange(idx: number) {
    setSelectedIdx(idx);
  }

  function stepCantidad(delta: number) {
    const next = Math.max(1, cantidad + delta);
    setCantidad(next);
    setCantidadRaw(String(next));
  }

  function handleCantidadChange(v: string) {
    const clean = v.replace(/[^0-9.]/g, '');
    setCantidadRaw(clean);
    const num = parseFloat(clean);
    if (!isNaN(num) && num >= 1) setCantidad(num);
  }

  function handleCantidadBlur() {
    const num = parseFloat(cantidadRaw);
    if (isNaN(num) || num < 1) {
      setCantidad(1);
      setCantidadRaw('1');
    } else {
      setCantidad(num);
      setCantidadRaw(String(num));
    }
  }

  function handleAgregar() {
    const precio = parseFloat(precioInput) || 0;
    onAgregar(item, cantidad, precio, selectedOpcion.unidad, selectedIdx, nota.trim() || undefined);
    setAgregado(true);
    setTimeout(() => setAgregado(false), 1200);
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      onClick={onClose}
    >
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />

      {/* Card */}
      <div
        className="relative bg-white rounded-2xl shadow-2xl w-full max-w-sm flex flex-col overflow-hidden"
        onClick={e => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-5 pt-5 pb-4 border-b border-gray-100">
          <div className="flex items-start justify-between gap-3">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-1.5 mb-1.5">
                <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${color.dot}`} />
                <span className={`text-[10px] font-semibold uppercase tracking-wider ${color.text}`}>
                  {item.categoria}
                </span>
              </div>
              <h2 className="text-base font-black text-gray-800 leading-snug">
                {item.nombre}
              </h2>
            </div>
            <button
              onClick={onClose}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-full text-gray-400 hover:text-gray-700 hover:bg-gray-100 transition-colors text-lg leading-none"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Body */}
        <div className="px-5 py-4 space-y-4">
          {/* Unidad */}
          {hasDropdown ? (
            <div>
              <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
                Unidad de medida
              </label>
              <div className="relative">
                <select
                  value={selectedIdx}
                  onChange={e => handleUnitChange(Number(e.target.value))}
                  className="w-full appearance-none text-sm font-medium border border-gray-200 rounded-xl px-3 py-2.5 pr-8 text-gray-700 bg-gray-50 hover:bg-gray-100 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] transition cursor-pointer"
                >
                  {allOpciones.map((op, i) => (
                    <option key={i} value={i}>{op.unidad}</option>
                  ))}
                </select>
                <span className="pointer-events-none absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 text-xs">▾</span>
              </div>
            </div>
          ) : (
            <div>
              <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1">Unidad</p>
              <p className="text-sm font-semibold text-gray-700">{selectedOpcion.unidad}</p>
            </div>
          )}

          {/* Cantidad */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Cantidad
            </label>
            <div className="flex items-center justify-center gap-3">
              <button
                onClick={() => stepCantidad(-1)}
                className="w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg transition-colors flex-shrink-0"
              >
                −
              </button>
              <input
                type="number"
                min="1"
                step="1"
                value={cantidadRaw}
                onChange={e => handleCantidadChange(e.target.value)}
                onFocus={e => e.target.select()}
                onBlur={handleCantidadBlur}
                className="w-24 text-center text-xl font-black text-gray-800 border border-gray-200 rounded-xl py-2 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] transition"
              />
              <button
                onClick={() => stepCantidad(1)}
                className="w-10 h-10 rounded-xl border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-600 font-bold text-lg transition-colors flex-shrink-0"
              >
                +
              </button>
            </div>
          </div>

          {/* Precio */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Precio unitario
            </label>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-sm font-semibold text-gray-400">
                S/.
              </span>
              <input
                type="number"
                min="0"
                step="0.01"
                value={precioInput}
                onChange={e => setPrecioInput(e.target.value)}
                placeholder="0.00"
                className="w-full pl-9 pr-4 py-2.5 border border-gray-200 rounded-xl text-sm font-semibold text-gray-800 bg-gray-50 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] transition"
              />
            </div>
            {parseFloat(precioInput) > 0 && cantidad > 0 && (
              <p className="text-xs text-gray-400 mt-1.5 text-right">
                Subtotal:{' '}
                <span className="font-bold text-[#c0392b]">
                  {formatSoles(parseFloat(precioInput) * cantidad)}
                </span>
              </p>
            )}
          </div>

          {/* Nota */}
          <div>
            <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wider mb-1.5">
              Nota <span className="normal-case font-normal text-gray-400">(opcional)</span>
            </label>
            <textarea
              rows={2}
              placeholder="Ej: sin tapa, color rojo, entregar por separado…"
              value={nota}
              onChange={e => setNota(e.target.value)}
              className="w-full px-3 py-2 text-sm border border-gray-200 rounded-xl bg-gray-50 text-gray-800 placeholder-gray-300 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20 focus:border-[#1a3a6b] transition resize-none"
            />
          </div>
        </div>

        {/* Footer */}
        <div className="px-5 pb-5">
          <button
            onClick={handleAgregar}
            className={`w-full py-3 rounded-xl text-sm font-bold tracking-wide transition-all duration-200 ${
              agregado
                ? 'bg-emerald-500 text-white'
                : 'bg-[#1a3a6b] hover:bg-[#2554a0] text-white'
            }`}
          >
            {agregado ? '✓ Agregado al pedido' : 'Agregar al carrito'}
          </button>
        </div>
      </div>
    </div>
  );
}
