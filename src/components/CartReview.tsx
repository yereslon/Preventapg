import { useState } from 'react';
import type { CartState } from '../types/cart';
import type { OrderFormData } from '../types/catalog';
import { formatSoles } from '../utils/format';
import { OrderForm } from './OrderForm';
import { QuantityInput } from './QuantityInput';

interface Props {
  cart: CartState;
  ubicaciones: string[];
  onSumarUno: (id: number) => void;
  onQuitarUno: (id: number) => void;
  onCambiarCantidad: (id: number, cantidad: number) => void;
  onEliminar: (id: number) => void;
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
  onVolver,
  onConfirmar,
}: Props) {
  const [form, setForm] = useState<OrderFormData>(FORM_VACIO);
  const [errors, setErrors] = useState<Partial<Record<keyof OrderFormData, string>>>({});

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

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm divide-y divide-gray-100 overflow-hidden">
                {cart.items.map(item => (
                  <div key={item.id} className="p-4 flex gap-3">
                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-bold text-gray-800 leading-snug">
                        {item.nombre}
                      </p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {item.categoria} · {item.unidad}
                      </p>
                      <p className="text-xs text-gray-500 mt-1">
                        {formatSoles(item.precio)} c/u
                      </p>
                    </div>

                    {/* Controles cantidad */}
                    <div className="flex flex-col items-end justify-between gap-2">
                      <button
                        onClick={() => onEliminar(item.id)}
                        className="text-gray-300 hover:text-red-500 text-sm transition-colors leading-none"
                        title="Eliminar"
                      >
                        ✕
                      </button>

                      <QuantityInput
                        size="md"
                        value={item.cantidad}
                        onIncrement={() => onSumarUno(item.id)}
                        onDecrement={() => onQuitarUno(item.id)}
                        onChange={v => onCambiarCantidad(item.id, v)}
                      />

                      <p className="text-sm font-extrabold text-red-700">
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
