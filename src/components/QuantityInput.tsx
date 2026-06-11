import { useState } from 'react';

interface Props {
  value: number;
  onIncrement: () => void;
  onDecrement: () => void;
  onChange: (v: number) => void;
  /** 'sm' = compacto CartPanel | 'md' = CartReview | 'lg' = modal principal */
  size?: 'sm' | 'md' | 'lg';
  /** Si se provee, aplica snap al valor al salir del campo */
  snapFn?: (v: number) => number;
  /** Valor mínimo aceptado (default 0.01) */
  min?: number;
  /** Nombre del producto para aria-labels contextuales */
  productoNombre?: string;
}

function fmt(v: number): string {
  return parseFloat(v.toFixed(3)).toString();
}

export function QuantityInput({
  value, onIncrement, onDecrement, onChange,
  size = 'md', snapFn, min = 0.01, productoNombre,
}: Props) {
  const [raw, setRaw] = useState('');
  const [focused, setFocused] = useState(false);

  // Cuando no está enfocado, el display es siempre derivado del valor externo.
  // Cuando está enfocado, mostramos lo que el usuario está escribiendo.
  const displayValue = focused ? raw : fmt(value);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const text = e.target.value;
    const limpio = text.replace(/[^0-9.]/g, '').replace(/^(\d*\.?\d*).*$/, '$1');
    setRaw(limpio);
    const num = parseFloat(limpio);
    if (!isNaN(num) && num > 0) onChange(num);
  }

  function handleBlur() {
    setFocused(false);
    let num = parseFloat(raw);
    if (isNaN(num) || num < min) return;
    if (snapFn) num = snapFn(num);
    onChange(num);
  }

  const btn =
    size === 'sm'
      ? 'w-6 h-6 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold text-sm transition-colors select-none'
    : size === 'lg'
      ? 'w-10 h-10 flex items-center justify-center text-gray-600 hover:bg-gray-100 font-bold text-lg transition-colors select-none'
    : 'w-7 h-7 flex items-center justify-center text-gray-500 hover:bg-gray-200 font-bold transition-colors select-none';

  const inp =
    size === 'sm'
      ? 'w-12 text-center text-xs font-bold text-gray-800 bg-transparent border-0 outline-none py-0'
    : size === 'lg'
      ? 'w-20 text-center text-lg font-black text-gray-800 bg-transparent border-0 outline-none'
    : 'w-14 text-center text-sm font-bold text-gray-800 bg-transparent border-0 outline-none';

  const container =
    size === 'lg'
      ? 'flex items-center border border-gray-200 rounded-xl overflow-hidden bg-gray-50'
      : 'flex items-center border border-gray-200 rounded-lg overflow-hidden bg-white';

  const labelReducir = productoNombre ? `Reducir cantidad de ${productoNombre}` : 'Reducir cantidad';
  const labelAumentar = productoNombre ? `Aumentar cantidad de ${productoNombre}` : 'Aumentar cantidad';

  return (
    <div className={container}>
      <button type="button" onClick={onDecrement} className={btn} aria-label={labelReducir}>−</button>
      <input
        type="number"
        inputMode="decimal"
        step="any"
        min={min}
        value={displayValue}
        onChange={handleChange}
        onFocus={e => { setFocused(true); setRaw(fmt(value)); e.target.select(); }}
        onBlur={handleBlur}
        className={inp}
        aria-label={productoNombre ? `Cantidad de ${productoNombre}` : 'Cantidad'}
      />
      <button type="button" onClick={onIncrement} className={btn} aria-label={labelAumentar}>+</button>
    </div>
  );
}
