import { useState } from 'react';
import type { CatalogItem } from '../types/catalog';
import { formatSoles } from '../utils/format';

interface Props {
  item: CatalogItem;
  onAgregar: (item: CatalogItem, cantidad: number) => void;
}

export function ProductCard({ item, onAgregar }: Props) {
  const [cantidad, setCantidad] = useState(1);
  const [agregado, setAgregado] = useState(false);

  function handleAgregar() {
    onAgregar(item, cantidad);
    setAgregado(true);
    setCantidad(1);
    setTimeout(() => setAgregado(false), 1500);
  }

  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow duration-200 flex flex-col overflow-hidden">
      {/* Badge categoría */}
      <div className="px-4 pt-4">
        <span className="inline-block text-xs font-semibold px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 border border-blue-200">
          {item.categoria}
        </span>
      </div>

      {/* Nombre y unidad */}
      <div className="px-4 pt-2 pb-3 flex-1">
        <h3 className="text-sm font-bold text-gray-800 leading-snug line-clamp-2">
          {item.nombre}
        </h3>
        <p className="text-xs text-gray-400 mt-1">{item.unidad}</p>
      </div>

      {/* Precio */}
      <div className="px-4 pb-3 border-t border-gray-100 pt-3">
        <span className="text-lg font-extrabold text-red-700">
          {formatSoles(item.precio)}
        </span>
        <span className="text-xs text-gray-400 ml-1">/ {item.unidad}</span>
      </div>

      {/* Controles */}
      <div className="px-4 pb-4 flex items-center gap-2">
        <div className="flex items-center border border-gray-200 rounded-lg overflow-hidden">
          <button
            onClick={() => setCantidad(q => Math.max(1, q - 1))}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg"
          >
            −
          </button>
          <span className="w-8 text-center text-sm font-semibold text-gray-800">
            {cantidad}
          </span>
          <button
            onClick={() => setCantidad(q => q + 1)}
            className="w-8 h-8 flex items-center justify-center text-gray-600 hover:bg-gray-100 transition-colors font-bold text-lg"
          >
            +
          </button>
        </div>

        <button
          onClick={handleAgregar}
          className={`flex-1 h-8 rounded-lg text-sm font-semibold transition-all duration-200 ${
            agregado
              ? 'bg-green-500 text-white'
              : 'bg-[#1a3a6b] hover:bg-[#2554a0] text-white'
          }`}
        >
          {agregado ? '✓ Agregado' : 'Agregar'}
        </button>
      </div>
    </div>
  );
}
