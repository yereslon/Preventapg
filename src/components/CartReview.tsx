import { useState } from 'react';
import type { CartState } from '../types/cart';
import type { OrderFormData } from '../types/catalog';
import { formatSoles } from '../utils/format';
import { OrderForm } from './OrderForm';
import { QuantityInput } from './QuantityInput';

interface Props {
  cart: CartState;
  ubicaciones: string[];
  onSumarUno: (cartKey: string) => void;
  onQuitarUno: (cartKey: string) => void;
  onCambiarCantidad: (cartKey: string, cantidad: number) => void;
  onEliminar: (cartKey: string) => void;
  onCambiarPrecio: (cartKey: string, precio: number) => void;
  onVolver: () => void;
  onConfirmar: (form: OrderFormData) => void;
}

const FORM_VACIO: OrderFormData = { nombre: '', ubicacion: '', notas: '' };

export function CartReview({
  cart,
  ubicaciones,
  onSumarUno,
  onQuitarUno,
  onCambiarCantidad,
  onEliminar,
  onCambiarPrecio,
  onVolver,
  onConfirmar,
}: Props) {
  const [form, setForm] = useState<OrderFormData>(FORM_VACIO);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({});
  const [editingPriceId, setEditingPriceId] = useState<string | null>(null);
  const [tempPrice, setTempPrice] = useState('');

  function validate(): boolean {
    const next: Partial<Record<keyof OrderFormData, string>> = {};
    if (!form.nombre.trim()) next.nombre = 'El nombre es obligatorio.';
    if (!form.ubicacion.trim()) next.ubicacion = 'Selecciona una ubicación.';
    setErrors(next);
    return Object.keys(next).length === 0;
  }

  function handleConfirmar() {
    if (validate()) onConfirmar(form);
  }

  function startEditPrice(cartKey: string, precio: number) {
    setEditingPriceId(cartKey);
    setTempPrice(String(precio));
  }

  function confirmEditPrice(cartKey: string) {
    const parsed = parseFloat(tempPrice.replace(/[^0-9.-]/g, ''));
    if (isFinite(parsed) && parsed > 0) {
      onCambiarPrecio(cartKey, parsed);
    }
    setEditingPriceId(null);
    setTempPrice('');
  }

  function cancelEditPrice() {
    setEditingPriceId(null);
    setTempPrice('');
  }

  const vacio = cart.items.length === 0;

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Sub-header de la vista */}
      <div className="bg-white border-b border-gray-200 sticky top-16 z-20">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 h-12 flex items-center gap-3">
          <button
            onClick={onVolver}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-[#1a3a6b] transition-colors font-medium"
          >
            ← Seguir comprando
          </button>
          <span className="text-gray-300">|</span>
          <span className="text-sm font-semibold text-gray-700">
            Revisión del pedido
          </span>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-8">
        {vacio ? (
          <div className="text-center py-24 space-y-3">
            <p className="text-4xl">🛒</p>
            <p className="text-gray-500 text-sm">
              El carrito está vacío.{' '}
              <button
                onClick={onVolver}
                className="text-[#2554a0] font-semibold hover:underline"
              >
                Explorar catálogo
              </button>
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-5 gap-8">

            {/* ── Columna izquierda: items ─────────────── */}
            <section className="lg:col-span-3 space-y-4">
              <h2 className="text-base font-bold text-gray-800">
                Productos seleccionados
                <span className="ml-2 text-gray-400 font-normal text-sm">
                  ({cart.items.length} {cart.items.length === 1 ? 'ítem' : 'ítems'})
                </span>
              </h2>

              <div className="space-y-3">
                {cart.items.map(item => (
                  <div key={item.cartKey} className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">

                    {/* Cabecera: nombre + eliminar */}
                    <div className="flex items-start justify-between gap-3 px-4 pt-4 pb-2">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="inline-block text-[10px] font-semibold uppercase tracking-wide text-blue-700 bg-blue-50 border border-blue-100 rounded-full px-2 py-0.5">
                            {item.categoria}
                          </span>
                          <span className="inline-block text-[10px] font-semibold text-gray-500 bg-gray-100 rounded-full px-2 py-0.5">
                            {item.unidad}
                          </span>
                        </div>
                        <p className="text-sm font-bold text-gray-800 leading-snug">
                          {item.nombre}
                        </p>
                      </div>
                      <button
                        onClick={() => onEliminar(item.cartKey)}
                        className="mt-0.5 flex-shrink-0 w-6 h-6 flex items-center justify-center rounded-full text-gray-400 hover:bg-red-50 hover:text-red-500 transition-colors text-xs"
                        title="Eliminar"
                      >
                        ✕
                      </button>
                    </div>

                    {/* Pie: precio, editar, cantidad, subtotal */}
                    <div className="flex items-center gap-3 px-4 pb-4 pt-2 border-t border-gray-100">

                      {/* Precio + editar */}
                      <div className="flex-1 min-w-0">
                        {editingPriceId === item.cartKey ? (
                          <div className="flex items-center gap-1.5">
                            <span className="text-xs text-gray-400">S/.</span>
                            <input
                              type="number"
                              min="0.01"
                              step="0.01"
                              value={tempPrice}
                              onChange={e => setTempPrice(e.target.value)}
                              onKeyDown={e => {
                                if (e.key === 'Enter') confirmEditPrice(item.cartKey);
                                if (e.key === 'Escape') cancelEditPrice();
                              }}
                              className="w-20 text-sm font-bold border border-[#1a3a6b] rounded-lg px-2 py-1 text-gray-800 focus:outline-none focus:ring-2 focus:ring-[#1a3a6b]/20"
                              autoFocus
                            />
                            <button
                              onClick={() => confirmEditPrice(item.cartKey)}
                              className="px-2 py-1 rounded-lg bg-green-500 hover:bg-green-600 text-white text-xs font-bold transition-colors"
                            >
                              ✓
                            </button>
                            <button
                              onClick={cancelEditPrice}
                              className="px-2 py-1 rounded-lg bg-gray-100 hover:bg-gray-200 text-gray-600 text-xs font-bold transition-colors"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div className="flex items-center gap-2">
                            <span className="text-sm font-extrabold text-gray-800">
                              {formatSoles(item.precio)}
                            </span>
                            <span className="text-xs text-gray-400">c/u</span>
                            <button
                              onClick={() => startEditPrice(item.cartKey, item.precio)}
                              className="flex items-center gap-1 px-2 py-0.5 rounded-md bg-[#1a3a6b]/8 hover:bg-[#1a3a6b]/15 text-[#1a3a6b] text-[11px] font-semibold transition-colors border border-[#1a3a6b]/20"
                            >
                              ✎ Editar
                            </button>
                          </div>
                        )}
                      </div>

                      {/* Cantidad */}
                      <QuantityInput
                        size="md"
                        value={item.cantidad}
                        onIncrement={() => onSumarUno(item.cartKey)}
                        onDecrement={() => onQuitarUno(item.cartKey)}
                        onChange={v => onCambiarCantidad(item.cartKey, v)}
                      />

                      {/* Subtotal */}
                      <p className="text-sm font-extrabold text-[#c0392b] w-20 text-right flex-shrink-0">
                        {formatSoles(item.precio * item.cantidad)}
                      </p>
                    </div>

                  </div>
                ))}
              </div>
            </section>

            {/* ── Columna derecha: formulario + total ─── */}
            <aside className="lg:col-span-2 space-y-4">
              {/* Formulario */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
                <h2 className="text-base font-bold text-gray-800 mb-4">
                  Datos del pedido
                </h2>
                <OrderForm
                  form={form}
                  ubicaciones={ubicaciones}
                  onChange={setForm}
                  errors={errors}
                />
              </div>

              {/* Resumen de total */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5 space-y-3">
                <h2 className="text-base font-bold text-gray-800">Resumen</h2>

                <div className="space-y-1.5 text-sm">
                  {cart.items.map(item => (
                    <div key={item.id} className="flex justify-between text-gray-600">
                      <span className="truncate max-w-[60%]">
                        {item.nombre}{' '}
                        <span className="text-gray-400">×{item.cantidad}</span>
                      </span>
                      <span className="font-medium">
                        {formatSoles(item.precio * item.cantidad)}
                      </span>
                    </div>
                  ))}
                </div>

                <div className="border-t border-gray-100 pt-3 flex justify-between items-center">
                  <span className="font-bold text-gray-800">Total</span>
                  <span className="text-xl font-extrabold text-red-700">
                    {formatSoles(cart.total)}
                  </span>
                </div>

                <button
                  onClick={handleConfirmar}
                  className="w-full py-3 rounded-xl text-sm font-bold text-white transition-colors"
                  style={{ background: '#c0392b' }}
                  onMouseEnter={e => (e.currentTarget.style.background = '#96281b')}
                  onMouseLeave={e => (e.currentTarget.style.background = '#c0392b')}
                >
                  Confirmar pedido →
                </button>
              </div>
            </aside>

          </div>
        )}
      </div>
    </div>
  );
}
