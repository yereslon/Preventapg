import type { CartState } from '../types/cart';
import { formatSoles } from '../utils/format';
import { QuantityInput } from './QuantityInput';

interface Props {
  cart: CartState;
  onSumarUno: (cartKey: string) => void;
  onQuitarUno: (cartKey: string) => void;
  onCambiarCantidad: (cartKey: string, cantidad: number) => void;
  onEliminar: (cartKey: string) => void;
  onVaciar: () => void;
  onVerPedido: () => void;
}

export function CartPanel({
  cart,
  onSumarUno,
  onQuitarUno,
  onCambiarCantidad,
  onEliminar,
  onVaciar,
  onVerPedido,
}: Props) {
  const vacio = cart.items.length === 0;

  return (
    <aside className="flex flex-col h-full">
      {/* Encabezado */}
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-base font-bold text-gray-800">
          Pedido
          {!vacio && (
            <span className="ml-2 bg-red-600 text-white text-xs font-bold px-2 py-0.5 rounded-full">
              {parseFloat(cart.totalUnidades.toFixed(3))}
            </span>
          )}
        </h2>
        {!vacio && (
          <button
            onClick={onVaciar}
            className="text-xs text-gray-400 hover:text-red-600 transition-colors"
          >
            Vaciar
          </button>
        )}
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto space-y-2 pr-1">
        {vacio ? (
          <div className="flex flex-col items-center justify-center h-40 text-gray-400 text-sm gap-2">
            <span className="text-3xl">🛒</span>
            <p>El pedido está vacío</p>
          </div>
        ) : (
          cart.items.map(item => (
            <div key={item.cartKey} className="bg-gray-50 border border-gray-200 rounded-lg p-3">
              <div className="flex justify-between items-start gap-2">
                <p className="text-xs font-semibold text-gray-800 leading-snug flex-1">
                  {item.nombre}
                </p>
                <button
                  onClick={() => onEliminar(item.cartKey)}
                  className="text-gray-300 hover:text-red-500 transition-colors text-sm leading-none flex-shrink-0"
                  title="Eliminar"
                >
                  ✕
                </button>
              </div>

              <div className="flex items-center justify-between mt-2 gap-2">
                <QuantityInput
                  size="sm"
                  value={item.cantidad}
                  onIncrement={() => onSumarUno(item.cartKey)}
                  onDecrement={() => onQuitarUno(item.cartKey)}
                  onChange={v => onCambiarCantidad(item.cartKey, v)}
                />
                <span className="text-xs font-bold text-red-700 flex-shrink-0">
                  {formatSoles(item.precio * item.cantidad)}
                </span>
              </div>

              <p className="text-xs text-gray-400 mt-1">
                {formatSoles(item.precio)} / {item.unidad}
              </p>
            </div>
          ))
        )}
      </div>

      {/* Total + botón */}
      {!vacio && (
        <div className="border-t border-gray-200 pt-4 mt-4 space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-gray-500">Total</span>
            <span className="text-base font-extrabold text-gray-900">
              {formatSoles(cart.total)}
            </span>
          </div>
          <button
            onClick={onVerPedido}
            className="w-full py-3 bg-[#c0392b] hover:bg-[#96281b] text-white font-bold rounded-xl transition-colors text-sm"
          >
            Ver pedido →
          </button>
        </div>
      )}
    </aside>
  );
}
