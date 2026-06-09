import type { ProductoHistorial } from '../types/clients';
import type { CatalogItem } from '../types/catalog';
import { formatSoles } from '../utils/format';

interface Props {
  productos: ProductoHistorial[];
  catalogData: CatalogItem[];
  onAgregar: (item: CatalogItem, cantidad: number, precioOverride: number, unidadOverride: string, opcionIdx: number) => void;
  clienteNombre: string;
}

export function UltimosProductos({ productos, catalogData, onAgregar, clienteNombre }: Props) {
  if (productos.length === 0) return null;

  function findCatalogItem(nombre: string): CatalogItem | undefined {
    return catalogData.find(c => c.nombre === nombre);
  }

  return (
    <div className="border-b-2 border-amber-200 bg-amber-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-3">
        <p className="text-xs font-bold text-amber-700 mb-2 flex items-center gap-1.5">
          <span>⏱</span>
          Últimos productos de {clienteNombre}
        </p>
        <div className="flex gap-3 overflow-x-auto pb-1 [scrollbar-width:none]">
          {productos.map((p, i) => {
            const catalogItem = findCatalogItem(p.nombre);
            const disponible = Boolean(catalogItem);
            const opcionIdx = catalogItem
              ? Math.max(0, catalogItem.preciosExtra.findIndex(pe => pe.unidad === p.unidad))
              : 0;
            const esNegociado = p.precio !== p.precioBase;

            return (
              <div
                key={i}
                className="bg-white border border-amber-200 rounded-xl p-3 flex-shrink-0 w-36 flex flex-col gap-1.5"
              >
                <p className="text-xs font-bold text-gray-800 leading-tight line-clamp-2 min-h-[2rem]">
                  {p.nombre}
                </p>
                <div className="flex-1">
                  <p className="text-sm font-black text-red-600">{formatSoles(p.precio)}</p>
                  {esNegociado && (
                    <p className="text-[10px] text-gray-400 line-through">{formatSoles(p.precioBase)}</p>
                  )}
                  <p className="text-[10px] text-gray-400">{p.unidad}</p>
                </div>
                <button
                  disabled={!disponible}
                  onClick={() => catalogItem && onAgregar(catalogItem, 1, p.precio, p.unidad, opcionIdx)}
                  className={`w-full py-1.5 rounded-lg text-xs font-bold transition-colors ${
                    disponible
                      ? 'bg-[#1a3a6b] hover:bg-[#2554a0] text-white'
                      : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  }`}
                >
                  {disponible ? '+ Agregar' : 'No disponible'}
                </button>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
